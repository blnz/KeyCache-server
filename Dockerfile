FROM node:latest

RUN mkdir -p /usr/KeyCache
RUN mkdir -p /usr/KeyCache/src
RUN mkdir -p /usr/KeyCache/data
RUN mkdir -p /usr/KeyCache/public

RUN apt-get update && apt-get install -y \
    sqlite3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY ./package.json /usr/KeyCache

COPY ./server.js /usr/KeyCache
COPY ./dbddl.sql /usr/KeyCache

COPY ./src /usr/KeyCache/src
COPY ./src /usr/KeyCache/src

WORKDIR /usr/KeyCache

RUN npm install

RUN sqlite3 data/KeyCache.db < ./dbddl.sql

EXPOSE 8000

CMD [ "npm", "start" ]
