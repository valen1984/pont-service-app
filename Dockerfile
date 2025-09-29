# =====================
# Etapa 1: Build
# =====================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiamos package.json + lockfiles primero (mejora cache)
COPY package*.json ./

# Instalamos dependencias completas
RUN npm install

# Copiamos todo el código
COPY . .

# Compilamos front y back usando el script de package.json
RUN npm run build

# =====================
# Etapa 2: Runtime
# =====================
FROM node:20-alpine AS runner
WORKDIR /app

# Copiamos package.json para instalar sólo prod deps
COPY package*.json ./

# Copiamos artefactos del builder
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist

# Instalamos sólo dependencias necesarias en runtime
RUN npm install --omit=dev

# Exponemos el puerto
EXPOSE 8080

# Comando de arranque
CMD ["npm", "start"]
