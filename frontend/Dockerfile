FROM node:18-slim AS build

WORKDIR /build

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable

COPY --from=build /build/dist /usr/share/nginx/html