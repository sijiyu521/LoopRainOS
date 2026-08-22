#!/bin/bash
# =====================================================================
#  LoopRainOS 每日自动更新脚本
#  由 cron 每天 03:00 调用： 0 3 * * * /bin/bash /root/LoopRainOS/auto-update.sh
#
#  流程：
#    1. 备份关键线上文件（db.json 用户数据 + server/index.js 运行版）
#    2. 丢弃工作区本地改动（docs 构建产物将被重建），git pull 干净合并
#    3. python3 generate.py 重新生成博客桌面数据
#    4. npm run build 构建前端到 docs/
#    5. 恢复备份的 db.json 与 server/index.js（线上版永远优先，不被动）
#    6. 部署：docs/ → /var/www/html（Nginx 站点根目录）
#    7. 重启后端 systemd 服务 + 健康检查
#
#  说明：server/data/db.json 与 server/index.js 以【服务器本地版】为准，
#        远端若更新它们会被忽略（日志中会提示差异）。如需远端版生效，
#        请手动处理这两个文件后再运行本脚本。
# =====================================================================

set -u

LOG_FILE="/root/LoopRainOS/auto-update.log"
exec >> "$LOG_FILE" 2>&1

echo "========================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] LoopRainOS auto-update started"

# ---------- 通用函数 ----------
fail() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*"
  exit 1
}

# ---------- 1. 环境准备 ----------
cd /root/LoopRainOS || fail "cd /root/LoopRainOS failed"

export NODE_OPTIONS="--openssl-legacy-provider"
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

WORKTREE_BRANCH=$(git branch --show-current)
WORKTREE_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git ls-remote origin -h refs/heads/main | awk '{print $1}')

echo "worktree branch=${WORKTREE_BRANCH} head=${WORKTREE_HEAD:0:9}"
echo "remote main head=${REMOTE_HEAD:0:9}"

if [ -z "$REMOTE_HEAD" ]; then
  fail "cannot reach origin/main (network down?)"
fi

# ---------- 2. 备份关键线上文件 ----------
BK=/tmp/looprain-backup
rm -rf "$BK"; mkdir -p "$BK"

if [ -f server/data/db.json ]; then
  cp -f server/data/db.json "$BK/db.json.bak"
  echo "backed up db.json ($(md5sum server/data/db.json | awk '{print $1}'))"
fi
if [ -f server/index.js ]; then
  cp -f server/index.js "$BK/server-index.js.bak"
  echo "backed up server/index.js"
fi

# ---------- 3. 丢弃工作区改动并拉取 ----------
# 丢弃跟踪文件的改动 + 删除未跟踪文件（docs 构建产物、临时文件），
# 但保留脚本自身、日志、node_modules
git checkout -- . || fail "git checkout failed"
git clean -fd -e auto-update.sh -e auto-update.log -e cron.log -e node_modules || fail "git clean failed"

git fetch origin main || fail "git fetch failed"
git merge --ff-only origin/main || fail "git merge failed (check remote state)"

NEW_HEAD=$(git rev-parse HEAD)
if [ "$NEW_HEAD" = "$WORKTREE_HEAD" ]; then
  echo "no new commits (already up to date), running safe no-op update"
fi

# ---------- 4. 重新生成桌面数据 ----------
python3 generate.py || fail "generate.py failed"

# ---------- 5. 构建前端 ----------
npm run build || fail "npm run build failed"
echo "frontend build OK"

# ---------- 6. 恢复线上关键文件（服务器版优先） ----------
# 6a. db.json：用户账号数据，永远以服务器本地为准
if [ -f "$BK/db.json.bak" ]; then
  if [ -f server/data/db.json ] && ! cmp -s "$BK/db.json.bak" server/data/db.json; then
    echo "WARN: db.json differs from backup (remote updated it) -> restoring local version"
  fi
  mkdir -p server/data
  cp -f "$BK/db.json.bak" server/data/db.json
  echo "restored local db.json"
else
  echo "no db.json backup, skipping restore"
fi

# 6b. server/index.js：线上运行版优先
if [ -f "$BK/server-index.js.bak" ]; then
  if [ -f server/index.js ] && cmp -s "$BK/server-index.js.bak" server/index.js; then
    echo "server/index.js unchanged (same as remote), no restore needed"
  else
    cp -f "$BK/server-index.js.bak" server/index.js
    echo "WARN: server/index.js restored to local running version (remote version differs)"
  fi
fi

# ---------- 7. 部署前端（Nginx 站点目录） ----------
echo "deploying docs/ -> /var/www/html"
rm -rf /tmp/newsite
mkdir -p /tmp/newsite
cp -a docs/. /tmp/newsite/
rm -rf /var/www/html
mv /tmp/newsite /var/www/html
chown -R root:root /var/www/html
chmod -R a+rX /var/www/html
echo "frontend deployed"

# ---------- 8. 重启后端 + 健康检查 ----------
echo "restarting looprainos-backend"
systemctl restart looprainos-backend || fail "systemctl restart looprainos-backend failed"

sleep 2
ACTIVE=$(systemctl is-active looprainos-backend 2>/dev/null)
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 'http://127.0.0.1:8079/api/health' 2>/dev/null || echo "000")
PROXY_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 'http://127.0.0.1:8079/api/proxy?url=https%3A%2F%2Fexample.com' 2>/dev/null || echo "000")

echo "backend active=${ACTIVE} health-http=${HTTP_CODE} proxy-http=${PROXY_CODE}"

# ---------- 9. 汇总 ----------
echo "========================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] done. from ${WORKTREE_HEAD:0:9} to ${NEW_HEAD:0:9} | health=${HTTP_CODE} proxy=${PROXY_CODE}"
rm -rf "$BK"