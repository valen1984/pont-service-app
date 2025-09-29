# ---------------------------
# Etapa 1: Build
# ---------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package.json y lock para instalar deps
COPY package*.json ./
RUN npm install

# Copiar todo el código
COPY . .

# 👇 Asegurar que la PUBLIC_KEY esté disponible en build
ARG VITE_MERCADOPAGO_PUBLIC_KEY
ENV VITE_MERCADOPAGO_PUBLIC_KEY=${VITE_MERCADOPAGO_PUBLIC_KEY}

# Compilar frontend y backend
RUN npm run build

# ---------------------------
# Etapa 2: Runtime
# ---------------------------
FROM node:20-alpine
WORKDIR /app

# Copiar package.json para instalar solo dependencias de producción
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copiar dist y dist-server ya compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Copiar .env si lo necesitás (opcional)
# COPY .env ./

# Exponer puerto
EXPOSE 8080

# Comando de arranque
CMD ["node", "dist-server/server/server.js"]
