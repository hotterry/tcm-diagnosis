#!/bin/bash
# ========================================
# 倪海厦中医体系 - 群晖 Docker 部署脚本
# 用法：在群晖 SSH 中运行此脚本
# ========================================

set -e

PROJECT_DIR="/volume1/docker/tcm-diagnosis"
PORT=8765

echo "=== 1. 创建项目目录 ==="
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "=== 2. 写入 Dockerfile ==="
cat > Dockerfile << 'DOCKERFILE'
FROM nginx:alpine
COPY app/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
DOCKERFILE

echo "=== 3. 写入 nginx.conf ==="
cat > nginx.conf << 'NGINX'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/html text/css application/javascript application/json;
    gzip_min_length 256;
    location ~* \.(css|js)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX

echo "=== 4. 写入 docker-compose.yml ==="
cat > docker-compose.yml << 'COMPOSE'
version: "3.8"
services:
  tcm:
    build: .
    container_name: tcm-diagnosis
    ports:
      - "8765:80"
    restart: unless-stopped
COMPOSE

echo "=== 5. 构建并启动 ==="
docker-compose up -d --build

echo ""
echo "✅ 部署完成！访问 http://$(hostname -I | awk '{print $1}'):$PORT"
