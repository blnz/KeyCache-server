# KeyCache-server
node server for KeyCache password manager

## Installing
```
docker build -t keycache-server .
```

or

```bash
npm install
mkdir data
cd data
sqlite3 KeyCache.db < ../initDB.sql
cd ..
```

## Running

```bash
docker run keycache-server
```

or

```bash
npm start
```
