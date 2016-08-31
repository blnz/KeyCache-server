
DROP SCHEMA IF EXISTS ssdb CASCADE;
DROP ROLE IF EXISTS ssdb;

CREATE ROLE ssdb with LOGIN password 'ssdb';
CREATE SCHEMA ssdb;

GRANT ALL PRIVILEGES ON SCHEMA ssdb TO ssdb;

--- 85b358db-d987-4d90-b952-f68fe02c6781

CREATE TABLE ssdb.user (
       user_id char(36) PRIMARY KEY,
       username varchar(64) UNIQUE,
       pword_hash_hash char(64),  
       pword_salt char(64),
       wrapped_master varchar(1024),
       last_update timestamp default now()
);


CREATE TABLE ssdb.card (
       card_id char(36) PRIMARY KEY,
       user_id char(36),
       last_update timestamp default now(),
       active boolean default TRUE,
       data_blob TEXT,
       FOREIGN KEY (user_id) REFERENCES ssdb.user(user_id)
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ssdb TO ssdb;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ssdb TO ssdb;
