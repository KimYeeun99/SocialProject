FROM node:14

RUN mkdir /app

WORKDIR /app

ADD ./ /app

RUN npm install

#ENV 설정하기

RUN npm run build

EXPOSE 3000

CMD ["npm","run","start"]