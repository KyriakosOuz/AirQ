# 1) BUILD STAGE
FROM node:18-alpine AS builder

WORKDIR /app
# copy package files and install dependencies first (for better cache)
COPY package.json package-lock.json ./
RUN npm ci

# copy source & build
COPY . .
RUN npm run build

# 2) PRODUCTION STAGE
FROM nginx:alpine

# copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# expose port 80 and run nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]