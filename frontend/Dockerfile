# ── Stage 1: Build React app ───────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV REACT_APP_API_URL=/api
RUN npm run build

# ── Stage 2: Serve with Nginx (NON-ROOT) ──────────────────────────
FROM nginx:1.25-alpine AS production

# Create non-root user for nginx
RUN addgroup -g 1001 -S webgroup \
 && adduser  -S webuser -u 1001 -G webgroup

# Copy built files and nginx config
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build .
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx needs to write to these dirs — give them to webuser
RUN chown -R webuser:webgroup /usr/share/nginx/html \
 && chown -R webuser:webgroup /var/cache/nginx \
 && chown -R webuser:webgroup /var/log/nginx \
 && touch /var/run/nginx.pid \
 && chown webuser:webgroup /var/run/nginx.pid

USER webuser
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
