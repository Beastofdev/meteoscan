# El panel, para levantarlo con docker compose (decision 0021).
#
# En dos partes: una compila y la otra sirve. Lo compilado son ficheros
# estaticos, asi que la imagen final no lleva Node ni las dependencias del
# panel: solo nginx y los ficheros.

# 1. Se compila con Node.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2. Y lo sirve nginx.
FROM nginx:1-alpine

# Reenvia /api a la API y devuelve el panel en cualquier otra direccion.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
