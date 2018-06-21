FROM node:10.5-alpine

WORKDIR /app
COPY . ./

RUN yarn install

CMD ["yarn", "start"]
