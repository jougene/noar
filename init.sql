create table users (
  id serial primary key,
  name varchar(255) not null,
  email varchar(255) not null,
  age smallint not null,

  created_at timestamp default CURRENT_TIMESTAMP not null,
  updated_at timestamp
);

create table posts (
  id serial primary key,
  status varchar(255) not null,
  title varchar(255) not null,
  text text not null,

  created_at timestamp default CURRENT_TIMESTAMP not null,
  updated_at timestamp,

  user_id integer references users
);

create table comments (
  id serial primary key,
  text text not null,

  created_at timestamp default CURRENT_TIMESTAMP not null,
  updated_at timestamp,

  user_id integer references users,
  post_id integer references posts
);
