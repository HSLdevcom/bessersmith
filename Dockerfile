FROM node:8-alpine

COPY gtfs-realtime.proto .
COPY index.js .
COPY src/*.js src/
COPY package.json .
COPY yarn.lock .

RUN yarn

CMD ["node", "index.js"]
