# Web quản trị THỢ NHANH: build Vite rồi phục vụ bằng nginx (proxy /api, /media sang backend)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Chỉ thay biến API_UPSTREAM, giữ nguyên các biến $uri, $http_host... của nginx
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM
ENV API_UPSTREAM=http://host.docker.internal:3000
EXPOSE 80
