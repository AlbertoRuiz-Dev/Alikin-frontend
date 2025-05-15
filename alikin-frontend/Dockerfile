# Etapa 1: Build Angular app
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm npm install ngx-infinite-scroll@15.0.0


COPY . .
RUN npm run build --prod

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar archivos build al Nginx public
COPY --from=builder /app/dist/alikin-frontend /usr/share/nginx/html

# Reemplazar configuración por defecto de Nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

