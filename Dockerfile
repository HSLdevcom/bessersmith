FROM node:10.11-alpine

WORKDIR /app
COPY . ./

RUN yarn install

CMD ["yarn", "start"]
