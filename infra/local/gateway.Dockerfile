FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY gateway/server.mjs ./gateway/server.mjs
EXPOSE 3000
CMD ["node", "gateway/server.mjs"]
