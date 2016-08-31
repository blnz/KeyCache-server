# KeyCache-server

## REST API server for storing KeyCache password manager records in the cloud.

This server provides synchronization services for the KeyCache applications. It allows a user to run KeyCache in several environments: phones, tablets, web browsers and desktop native applications; sharing and synchronizing data among them, while providing for secure end-to-end encryption of that data. The KeyCache applications do the encryption at the client endpoint, so this server has no knowledge of the contents of what is being stored.

The server know of two kinds of entities: users and cards. Users, (or an application acting on behalf of users), register with the server using a secret (password), then the user can login and store, fetch, update, delete and list cards. Cards consist of a globally unique ID, a version timestamp and encrypted data.

The server will also store, on behalf of the user, a passphrase-encrypted master key that the user's application can use to encrypt and decrypt the cards' content. The server never sees the passphrase that was used to encrypt the master key so is unable to make any use of the encrypted master key. It merely shares it among the user's KeyCache applications which then will be able to use the key only when the user provides the correct passphrase to decrypt the key.

## Prerequisites

To install and run, you have two paths you can follow: Docker or local. For local, you'll need postgresql and node.js installed. For Docker, you'll want docker and docker-compose.

## Installing
```
docker-compose build
```

or

```bash
npm install
psql < ./db/initDB.sql
```

## Running

```bash
docker-compose up
```

or

```bash
npm start
```
