FROM node:latest

RUN mkdir -p /usr/KeyCache
RUN mkdir -p /usr/KeyCache/src
RUN mkdir -p /usr/KeyCache/public

RUN apt-get update \
&& apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY ./package.json /usr/KeyCache

COPY ./server.js /usr/KeyCache

COPY ./src /usr/KeyCache/src
COPY ./public /usr/KeyCache/public

WORKDIR /usr/KeyCache

RUN npm install

EXPOSE 8000

CMD [ "npm", "start" ]
