# Docker 使用指南（入门）

## 一、Docker 简介

Docker 是一个开源的容器化平台，可以让开发者将应用及其依赖打包成一个轻量级、可移植的容器，实现"一次构建，到处运行"。

### 核心概念

- **镜像（Image）**：只读模板，包含运行应用所需的代码、库、环境变量等
- **容器（Container）**：镜像的运行实例，可以被启动、停止、删除
- **仓库（Repository）**：存放镜像的地方，如 Docker Hub

## 二、安装 Docker

### Windows / macOS
下载安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Linux（以 Ubuntu 为例）
```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
```

## 三、常用命令

### 镜像操作

```bash
# 搜索镜像
docker search nginx

# 拉取镜像
docker pull nginx:latest

# 查看本地镜像
docker images

# 删除镜像
docker rmi <image_id>

# 构建镜像
docker build -t myapp:v1 .
```

### 容器操作

```bash
# 运行容器
docker run -d --name mynginx -p 8080:80 nginx

# 参数说明：
# -d: 后台运行
# --name: 容器名称
# -p: 端口映射（宿主机:容器）
# -v: 挂载卷（宿主机路径:容器路径）

# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止）
docker ps -a

# 停止容器
docker stop <container_id>

# 启动容器
docker start <container_id>

# 重启容器
docker restart <container_id>

# 删除容器
docker rm <container_id>

# 进入容器
docker exec -it <container_id> /bin/bash

# 查看容器日志
docker logs <container_id>

# 查看容器资源占用
docker stats
```

### 常用运行示例

```bash
# 运行 Nginx
docker run -d -p 80:80 --name web nginx

# 运行 MySQL
docker run -d -p 3306:3306 --name mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -v /data/mysql:/var/lib/mysql \
  mysql:8.0

# 运行 Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

## 四、Dockerfile 基础

Dockerfile 是用于构建自定义镜像的脚本文件。

### 示例：构建 Node.js 应用镜像

```dockerfile
# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "app.js"]
```

### 常用指令

| 指令 | 说明 |
|------|------|
| `FROM` | 指定基础镜像 |
| `WORKDIR` | 设置工作目录 |
| `COPY` | 复制文件到容器 |
| `ADD` | 复制文件（支持 URL 和解压） |
| `RUN` | 执行命令 |
| `EXPOSE` | 声明端口 |
| `CMD` | 容器启动时执行的命令 |
| `ENTRYPOINT` | 容器入口点 |
| `ENV` | 设置环境变量 |
| `VOLUME` | 创建挂载点 |

### 构建与运行

```bash
# 构建镜像
docker build -t mynodeapp:v1 .

# 运行容器
docker run -d -p 3000:3000 mynodeapp:v1
```

## 五、Docker Compose

Docker Compose 用于定义和运行多容器应用。

### docker-compose.yml 示例

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: myapp
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  db_data:
```

### 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重新构建并启动
docker-compose up -d --build
```

## 六、实用技巧

### 数据持久化

```bash
# 使用命名卷
docker volume create mydata
docker run -v mydata:/app/data myapp

# 使用绑定挂载
docker run -v /host/path:/container/path myapp
```

### 网络管理

```bash
# 创建网络
docker network create mynet

# 运行容器并加入网络
docker run --network mynet --name app1 myapp
docker run --network mynet --name app2 myapp

# 容器间可通过容器名互相访问
```

### 清理无用资源

```bash
# 清理停止的容器
docker container prune

# 清理未使用的镜像
docker image prune

# 清理所有未使用资源
docker system prune -a
```

## 七、常见问题

**Q: 容器启动后立即退出？**  
A: 检查 CMD/ENTRYPOINT 命令是否正确，使用 `docker logs <container_id>` 查看日志

**Q: 端口无法访问？**  
A: 确认端口映射 `-p` 参数正确，检查防火墙设置

**Q: 如何修改运行中的容器？**  
A: 不建议直接修改，应修改 Dockerfile 后重新构建镜像

---

更多详细信息请参考 [Docker 官方文档](https://docs.docker.com/)