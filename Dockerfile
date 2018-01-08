FROM node:9-alpine

WORKDIR /app
COPY . ./

RUN yarn

CMD ["yarn", "start", "-c", "/run/secrets/config.yaml"]
