# LoopRainOS Windows PowerShell 部署脚本
# 用法: .\deploy.ps1 -Mode static|full|docker -Host your-server-ip
param(
    [ValidateSet("static","full","docker")]
    [string]$Mode = "static",

    [string]$Host = "",

    [string]$User = "root",

    [int]$Port = 22,

    [string]$KeyPath = "$env:USERPROFILE\.ssh\id_rsa",

    [string]$DeployPath = "/var/www/looprainos"
)

$ErrorActionPreference = "Stop"

Write-Host @"
  ╔══════════════════════════════════════╗
  ║     LoopRainOS 部署工具 (Windows)    ║
  ╚══════════════════════════════════════╝
"@ -ForegroundColor Cyan

if (-not $Host) {
    Write-Host "[ERROR] 请指定服务器地址: -Host your-server-ip" -ForegroundColor Red
    exit 1
}

# 构建 SSH 参数
$sshArgs = @("-p", $Port)
if (Test-Path $KeyPath) {
    $sshArgs += @("-i", $KeyPath)
}
$sshTarget = "$User@$Host"

# 测试连接
Write-Host "[INFO] 测试 SSH 连接..." -ForegroundColor Green
$testResult = ssh @sshArgs -o ConnectTimeout=5 $sshTarget "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 无法连接到 $Host" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}
Write-Host "[INFO] SSH 连接成功" -ForegroundColor Green

# 构建项目
Write-Host "[INFO] 开始构建..." -ForegroundColor Green
python generate.py 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "[WARN] generate.py 执行失败" -ForegroundColor Yellow }
npm install --legacy-peer-deps
$env:NODE_OPTIONS = "--openssl-legacy-provider"
npm run build

# 创建远程目录
ssh @sshArgs $sshTarget "mkdir -p $DeployPath"

# 上传文件
Write-Host "[INFO] 上传文件..." -ForegroundColor Green
scp @sshArgs -r "$PSScriptRoot\..\docs\*" "${sshTarget}:${DeployPath}/"

if ($Mode -eq "full" -or $Mode -eq "docker") {
    # 上传后端
    ssh @sshArgs $sshTarget "mkdir -p $DeployPath/server"
    scp @sshArgs -r "$PSScriptRoot\..\server\*" "${sshTarget}:${DeployPath}/server/"
    ssh @sshArgs $sshTarget "cd $DeployPath/server && npm install --production"
}

if ($Mode -eq "docker") {
    # Docker 部署
    Write-Host "[INFO] Docker 部署..." -ForegroundColor Green
    scp @sshArgs "$PSScriptRoot\..\docker-compose.yml" "${sshTarget}:${DeployPath}/"
    scp @sshArgs -r "$PSScriptRoot\*" "${sshTarget}:${DeployPath}/deploy/"
    ssh @sshArgs $sshTarget "cd $DeployPath && docker-compose down 2>/dev/null; docker-compose up -d --build"
} else {
    # 配置 Nginx
    Write-Host "[INFO] 配置 Nginx..." -ForegroundColor Green
    $nginxConf = @"
server {
    listen 80;
    server_name _;
    root $DeployPath;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8079;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
"@
    # 写入远程 Nginx 配置
    $nginxConf | ssh @sshArgs $sshTarget "cat > /etc/nginx/sites-available/looprainos"
    ssh @sshArgs $sshTarget "ln -sf /etc/nginx/sites-available/looprainos /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"

    if ($Mode -eq "full") {
        # PM2 守护后端
        ssh @sshArgs $sshTarget "command -v pm2 >/dev/null || npm install -g pm2; pm2 delete looprainos-backend 2>/dev/null; pm2 start $DeployPath/server/index.js --name looprainos-backend; pm2 save"
    }
}

Write-Host "[INFO] 部署完成！访问 http://$Host" -ForegroundColor Green