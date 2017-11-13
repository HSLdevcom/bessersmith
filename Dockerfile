FROM node:8-alpine

COPY build .
COPY config.yaml .

RUN yarn

CMD ["yarn", "start", "-c", "config.yaml"]
