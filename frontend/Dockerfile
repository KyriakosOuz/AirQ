# Stage 1 - Build
FROM node:20 AS builder

WORKDIR /app
COPY . /app

# Ensure .env.production is present
COPY .env.production /app/.env.production

RUN npm install
RUN npm run build

# Stage 2 - Serve with nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
