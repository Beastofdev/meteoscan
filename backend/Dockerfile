# La API, para levantarla con docker compose (decision 0021).
#
# node:24-alpine es la imagen oficial de Node 24 sobre Alpine, una distribucion
# de Linux pequena: la misma version de Node que pide el proyecto, en menos
# espacio.
FROM node:24-alpine

WORKDIR /app

# Primero el manifiesto y el lock, y el codigo despues. Docker guarda cada paso:
# si cambia el codigo pero no las dependencias, se reaprovecha la instalacion en
# vez de repetirla.
COPY package.json package-lock.json ./
# npm ci instala exactamente lo del lock. --omit=dev deja fuera lo que solo
# hace falta para desarrollar.
RUN npm ci --omit=dev

COPY src ./src

# La imagen oficial trae un usuario sin privilegios: un proceso que no necesita
# ser root no debe serlo, tampoco dentro de un contenedor.
USER node

EXPOSE 8005
# Sin npm por medio: npm start pasaria --env-file=../.env, que en la imagen no
# existe. Las variables las pone el compose.
CMD ["node", "src/server.js"]
