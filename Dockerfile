FROM node:alpine

EXPOSE 8081

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

COPY . .

CMD ["sh", "-c", "node index.js" ]