FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

# Nginxの公開フォルダに、dist の中身だけをコピー
COPY --from=build-stage /app/dist /usr/share/nginx/html

# nginx.conf をコンテナのデフォルト設定に上書き
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
