DROP DATABASE IF EXISTS loker_it;

CREATE DATABASE loker_it;
\c loker_it

DROP TABLE IF EXISTS captions;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE captions (
    caption_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    caption_text text NOT NULL
);

INSERT INTO
    captions (caption_text)
VALUES
    ('caption 0001'),
    ('caption 0002');
