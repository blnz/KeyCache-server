CREATE TABLE user (
       user_id INTEGER PRIMARY KEY,
       user_name TEXT,
       pword_hash TEXT,
       pword_salt TEXT,
       last_update TEXT
);

CREATE TABLE card (
       card_id INTEGER PRIMARY KEY,
       user_id INTEGER,
       version INTEGER,
       data_blob TEXT,
       FOREIGN KEY (user_id) REFERENCES user(user_id)
);
