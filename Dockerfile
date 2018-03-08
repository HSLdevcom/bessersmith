FROM node:9-alpine

WORKDIR /app
COPY . ./

RUN yarn

CMD ["yarn", "start"]
