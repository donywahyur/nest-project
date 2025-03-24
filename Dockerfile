FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install 

RUN npm rebuild bcrypt --build-from-source


COPY . .

COPY .env ./

ARG APP_PORT=3001

ENV APP_PORT=${APP_PORT}

EXPOSE ${APP_PORT}

CMD ["npm", "run", "start:prod"]