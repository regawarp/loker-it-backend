DROP DATABASE IF EXISTS loker_it;

CREATE DATABASE loker_it;
\c loker_it

DROP TABLE IF EXISTS captions cascade;
DROP TABLE IF EXISTS posters cascade;
DROP TABLE IF EXISTS tweets cascade;
DROP TABLE IF EXISTS tweets_checkpoint cascade;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE captions (
    caption_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    caption_text text NOT NULL
);

INSERT INTO
    captions (caption_text)
VALUES
    ('Perusahaan [Nama Perusahaan] sedang membuka lowongan kerja untuk posisi [Pekerjaan]');

CREATE TABLE posters (
    poster_id text PRIMARY KEY,
    poster_tweet_id uuid NULL,
    poster_image_path text NOT NULL,
    poster_group text NULL,
    poster_message_date timestamptz not null,
    poster_created_date timestamptz not null default now()
);

create unique index poster_pk on posters (
    poster_id
);

INSERT INTO
    posters (poster_id, poster_image_path, poster_message_date)
VALUES
    ('hash-poster-1', './public/media/SaulGoodman1.png', '2022-12-01T07:16:09.117Z'),
    ('hash-poster-2', './public/media/SaulGoodman2.png', '2022-12-01T07:16:09.117Z');

CREATE TABLE tweets (
    tweet_id uuid DEFAULT uuid_generate_v4(),
    tweet_caption_text text NOT NULL,
    tweet_scheduled_date timestamptz not null,
    tweet_created_date timestamptz not null default now(),
    constraint pk_tweets primary key (tweet_id)
);

create unique index tweets_pk on tweets (
    tweet_id
);
INSERT INTO
    tweets (tweet_caption_text, tweet_scheduled_date)
VALUES
    ('caption 0001', '2022-12-01T07:16:09.117Z'),
    ('caption 0002', '2022-12-01T07:16:09.117Z');

alter table posters
    add constraint fk_posters_relations_tweets foreign key (poster_tweet_id)
        references tweets (tweet_id)
        on delete restrict on update restrict;

CREATE TABLE tweets_checkpoint (
    tweet_checkpoint_id uuid DEFAULT uuid_generate_v4(),
    tweet_checkpoint_last_posted_image text not null,
    tweet_checkpoint_last_posted_date timestamptz not null,
    constraint pk_tweets_checkpoint primary key (tweet_checkpoint_id, tweet_checkpoint_last_posted_image)
);

create unique index tweet_checkpoint_pk on tweets_checkpoint (
    tweet_checkpoint_id,
    tweet_checkpoint_last_posted_image
);

create unique index tweet_checkpoint_fk on tweets_checkpoint (
    tweet_checkpoint_last_posted_image
);

INSERT INTO
    tweets_checkpoint (tweet_checkpoint_last_posted_date, tweet_checkpoint_last_posted_image)
VALUES
    ('2022-12-01T07:16:09.117Z', 'hash-poster-1');
