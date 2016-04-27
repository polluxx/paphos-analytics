FROM node:5.10

RUN mkdir /src && npm install nodemon bower -g && apt-get update  && apt-get install -y wget

RUN wget https://github.com/jwilder/dockerize/releases/download/v0.2.0/dockerize-linux-amd64-v0.2.0.tar.gz
RUN tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.2.0.tar.gz

COPY ./ /src
WORKDIR /src
RUN npm install && bower install --allow-root

EXPOSE 5000

#VOLUME /src
#WORKDIR /src

CMD dockerize -wait http://mongo:27017 -wait http://rabbitmq:15672 -timeout 60s  npm start
