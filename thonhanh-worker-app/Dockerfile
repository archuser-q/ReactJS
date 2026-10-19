# App Thợ (Expo / React Native) — 2 cách chạy bằng Docker:
#   target "web": build bản web tĩnh, phục vụ bằng nginx (mở bằng trình duyệt để demo)
#   target "dev": chạy Expo dev server (Metro) để điện thoại quét QR bằng Expo Go
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --fetch-timeout=120000 --fetch-retries=5

# ---------- Bản dev cho điện thoại (Expo Go) ----------
FROM deps AS dev
COPY . .
ENV EXPO_NO_TELEMETRY=1
EXPOSE 8081
CMD ["npx", "expo", "start", "--lan", "--port", "8081"]

# ---------- Build bản web ----------
FROM deps AS build
COPY . .
ENV CI=1 EXPO_NO_TELEMETRY=1
RUN npx expo export --platform web --output-dir dist

# ---------- Phục vụ bản web ----------
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh && chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
