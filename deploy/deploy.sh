#!/bin/bash
# ============================================
# LoopRainOS 云服务器部署脚本
# 用法: bash deploy.sh [static|full|docker]
# ============================================
set -e

# 加载配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/deploy.conf"

# 命令行参数覆盖配置
DEPLOY_MODE="${1:-$DEPLOY_MODE}"

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 构建 SSH 命令
SSH_CMD="ssh -p ${SERVER_PORT}"
if [ -f "$SSH_KEY" ]; then
  SSH_CMD="$SSH_CMD -i $SSH_KEY"
fi
SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"

# ============================================
# 检查前置条件
# ============================================
check_prerequisites() {
  info "检查前置条件..."
  command -v ssh >/dev/null 2>&1 || error "需要安装 SSH 客户端"
  command -v rsync >/dev/null 2>&1 || warn "未安装 rsync，将使用 scp（较慢）"
  command -v npm >/dev/null 2>&1 || error "需要安装 Node.js / npm"
}

# ============================================
# 本地构建
# ============================================
build_project() {
  info "开始本地构建..."
  cd "$PROJECT_DIR"

  # 生成虚拟文件系统
  if [ -f "generate.py" ]; then
    info "运行 generate.py 生成文件索引..."
    python3 generate.py || python generate.py || warn "generate.py 执行失败，跳过"
  fi

  # 安装依赖并构建
  npm install --legacy-peer-deps
  NODE_OPTIONS="--openssl-legacy-provider" npm run build

  info "构建完成，产物在 docs/ 目录"
}

# ============================================
# 静态文件部署（仅前端）
# ============================================
deploy_static() {
  info "=== 静态文件部署模式 ==="

  # 构建
  build_project

  # 在服务器上创建目录
  $SSH_CMD $SSH_TARGET "mkdir -p $DEPLOY_PATH"

  # 同步文件
  if command -v rsync >/dev/null 2>&1; then
    info "使用 rsync 同步文件..."
    rsync -avz --delete \
      -e "ssh -p ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY}" \
      "$PROJECT_DIR/docs/" \
      "${SSH_TARGET}:${DEPLOY_PATH}/"
  else
    info "使用 scp 上传文件..."
    tar -czf /tmp/looprainos-build.tar.gz -C "$PROJECT_DIR/docs" .
    scp -P ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY} \
      /tmp/looprainos-build.tar.gz \
      ${SSH_TARGET}:/tmp/
    $SSH_CMD $SSH_TARGET "tar -xzf /tmp/looprainos-build.tar.gz -C $DEPLOY_PATH && rm /tmp/looprainos-build.tar.gz"
    rm /tmp/looprainos-build.tar.gz
  fi

  # 配置 Nginx
  info "配置 Nginx..."
  $SSH_CMD $SSH_TARGET "cat > /etc/nginx/sites-available/looprainos << 'NGINX_EOF'
server {
    listen ${FRONTEND_PORT};
    server_name _;
    root ${DEPLOY_PATH};
    index index.html;

    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
NGINX_EOF"

  # 启用站点
  $SSH_CMD $SSH_TARGET "
    ln -sf /etc/nginx/sites-available/looprainos /etc/nginx/sites-enabled/ &&
    nginx -t &&
    systemctl reload nginx
  "

  info "静态文件部署完成！访问 http://${SERVER_HOST}"
}

# ============================================
# 完整部署（前端 + 后端）
# ============================================
deploy_full() {
  info "=== 完整部署模式（前端 + 后端）==="

  # 构建
  build_project

  # 在服务器上创建目录
  $SSH_CMD $SSH_TARGET "mkdir -p $DEPLOY_PATH $DEPLOY_PATH/server"

  # 上传前端文件
  info "上传前端文件..."
  if command -v rsync >/dev/null 2>&1; then
    rsync -avz --delete \
      -e "ssh -p ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY}" \
      "$PROJECT_DIR/docs/" \
      "${SSH_TARGET}:${DEPLOY_PATH}/"
  else
    tar -czf /tmp/looprainos-frontend.tar.gz -C "$PROJECT_DIR/docs" .
    scp -P ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY} \
      /tmp/looprainos-frontend.tar.gz ${SSH_TARGET}:/tmp/
    $SSH_CMD $SSH_TARGET "tar -xzf /tmp/looprainos-frontend.tar.gz -C $DEPLOY_PATH && rm /tmp/looprainos-frontend.tar.gz"
    rm /tmp/looprainos-frontend.tar.gz
  fi

  # 上传后端文件
  info "上传后端文件..."
  if command -v rsync >/dev/null 2>&1; then
    rsync -avz --delete \
      -e "ssh -p ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY}" \
      "$PROJECT_DIR/server/" \
      "${SSH_TARGET}:${DEPLOY_PATH}/server/"
  else
    tar -czf /tmp/looprainos-backend.tar.gz -C "$PROJECT_DIR/server" .
    scp -P ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY} \
      /tmp/looprainos-backend.tar.gz ${SSH_TARGET}:/tmp/
    $SSH_CMD $SSH_TARGET "tar -xzf /tmp/looprainos-backend.tar.gz -C $DEPLOY_PATH/server && rm /tmp/looprainos-backend.tar.gz"
    rm /tmp/looprainos-backend.tar.gz
  fi

  # 在服务器上安装后端依赖
  info "安装后端依赖..."
  $SSH_CMD $SSH_TARGET "cd $DEPLOY_PATH/server && npm install --production"

  # 配置 Nginx（前端 + 反向代理后端 API）
  info "配置 Nginx..."
  $SSH_CMD $SSH_TARGET "cat > /etc/nginx/sites-available/looprainos << 'NGINX_EOF'
server {
    listen ${FRONTEND_PORT};
    server_name _;
    root ${DEPLOY_PATH};

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
NGINX_EOF"

  $SSH_CMD $SSH_TARGET "
    ln -sf /etc/nginx/sites-available/looprainos /etc/nginx/sites-enabled/ &&
    nginx -t &&
    systemctl reload nginx
  "

  # 使用 PM2 管理后端进程
  info "配置 PM2 守护后端进程..."
  $SSH_CMD $SSH_TARGET "
    command -v pm2 >/dev/null 2>&1 || npm install -g pm2
    pm2 delete looprainos-backend 2>/dev/null || true
    pm2 start $DEPLOY_PATH/server/index.js \
      --name looprainos-backend \
      --env PORT=$BACKEND_PORT
    pm2 save
    pm2 startup systemd -u $SERVER_USER --hp /home/$SERVER_USER 2>/dev/null || true
  "

  info "完整部署完成！"
  info "前端: http://${SERVER_HOST}"
  info "后端 API: http://${SERVER_HOST}/api/"
}

# ============================================
# Docker 部署
# ============================================
deploy_docker() {
  info "=== Docker 部署模式 ==="

  # 构建
  build_project

  # 上传项目文件
  info "上传项目文件..."
  $SSH_CMD $SSH_TARGET "mkdir -p $DEPLOY_PATH"

  if command -v rsync >/dev/null 2>&1; then
    rsync -avz --delete \
      -e "ssh -p ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY}" \
      --exclude 'node_modules' --exclude '.git' \
      "$PROJECT_DIR/" \
      "${SSH_TARGET}:${DEPLOY_PATH}/"
  else
    warn "Docker 部署建议使用 rsync，当前使用 scp（排除 node_modules 和 .git）"
    tar --exclude='node_modules' --exclude='.git' \
      -czf /tmp/looprainos-docker.tar.gz -C "$PROJECT_DIR" .
    scp -P ${SERVER_PORT}${SSH_KEY:+ -i $SSH_KEY} \
      /tmp/looprainos-docker.tar.gz ${SSH_TARGET}:/tmp/
    $SSH_CMD $SSH_TARGET "tar -xzf /tmp/looprainos-docker.tar.gz -C $DEPLOY_PATH && rm /tmp/looprainos-docker.tar.gz"
    rm /tmp/looprainos-docker.tar.gz
  fi

  # 在服务器上构建并启动 Docker
  info "构建并启动 Docker 容器..."
  $SSH_CMD $SSH_TARGET "
    cd $DEPLOY_PATH &&
    docker-compose down 2>/dev/null || true &&
    docker-compose up -d --build
  "

  info "Docker 部署完成！访问 http://${SERVER_HOST}"
}

# ============================================
# 主流程
# ============================================
main() {
  echo ""
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║     LoopRainOS 云服务器部署工具      ║"
  echo "  ╚══════════════════════════════════════╝"
  echo ""

  # 检查配置是否已修改
  if [ "$SERVER_HOST" = "your-server-ip" ]; then
    error "请先编辑 deploy/deploy.conf，填入你的服务器信息"
  fi

  check_prerequisites

  # 测试 SSH 连接
  info "测试 SSH 连接..."
  if ! $SSH_CMD -o ConnectTimeout=5 $SSH_TARGET "echo 'SSH 连接成功'" 2>/dev/null; then
    error "无法连接到服务器 ${SERVER_HOST}:${SERVER_PORT}，请检查配置"
  fi

  case "$DEPLOY_MODE" in
    static) deploy_static ;;
    full)   deploy_full ;;
    docker) deploy_docker ;;
    *)
      error "未知部署模式: $DEPLOY_MODE。支持: static, full, docker"
      ;;
  esac

  echo ""
  info "部署完成！"
}

main "$@"