FROM node:24-slim AS build

WORKDIR /build

COPY ./package.json ./package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:stable

COPY --from=build /build/dist /usr/share/nginx/html