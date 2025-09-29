# ---------------------------
# Etapa de build
# ---------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos package.json y lock primero para aprovechar cache
COPY package*.json ./

# Instalamos dependencias (dev incluidas porque compila TS y Vite)
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos front + back + copiamos front a dist-server
RUN npm run build

# ---------------------------
# Etapa final (runtime)
# ---------------------------
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist

# Instalamos solo prod deps (más liviano)
RUN npm install --omit=dev

# Railway setea PORT en runtime, Express ya lo lee con process.env.PORT
EXPOSE 3000

# Arrancamos la app (usa tu script "start" -> node dist-server/server/server.js)
CMD ["npm", "start"]
