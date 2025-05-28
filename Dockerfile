# 1. Χτίζουμε την εφαρμογή με Node
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Χρησιμοποιούμε nginx για σερβίρισμα της build έκδοσης
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Αν χρησιμοποιήσεις custom routing, πρόσθεσε και αυτό:
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
main
