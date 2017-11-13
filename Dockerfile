FROM node:8-alpine

COPY build .

RUN yarn

CMD ["node", "index.js"]
