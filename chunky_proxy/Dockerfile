FROM node:9.3-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4445
CMD [ "npm", "run", "start" ]

