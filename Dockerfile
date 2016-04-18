FROM node:5.10

RUN mkdir /src && npm install nodemon bower -g && apt-get update

COPY ./ /src
WORKDIR /src
RUN npm install && bower install --allow-root

EXPOSE 5000

CMD npm start
