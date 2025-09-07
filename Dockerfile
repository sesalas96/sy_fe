# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create a simple nginx config that uses PORT environment variable
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'cat > /etc/nginx/conf.d/default.conf <<EOF' >> /docker-entrypoint.sh && \
    echo 'server {' >> /docker-entrypoint.sh && \
    echo '    listen \${PORT:-80};' >> /docker-entrypoint.sh && \
    echo '    server_name _;' >> /docker-entrypoint.sh && \
    echo '    root /usr/share/nginx/html;' >> /docker-entrypoint.sh && \
    echo '    index index.html;' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '    location / {' >> /docker-entrypoint.sh && \
    echo '        try_files \$uri \$uri/ /index.html;' >> /docker-entrypoint.sh && \
    echo '    }' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {' >> /docker-entrypoint.sh && \
    echo '        expires 1y;' >> /docker-entrypoint.sh && \
    echo '        add_header Cache-Control "public, immutable";' >> /docker-entrypoint.sh && \
    echo '    }' >> /docker-entrypoint.sh && \
    echo '}' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

ENTRYPOINT ["/docker-entrypoint.sh"]