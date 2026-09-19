create table users (
    user_id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    email varchar(255) UNIQUE not null,
    password varchar(255) not null,
);

CREATE TABLE udhar (
    udhar_id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    identity varchar(255) not null,
    amount int not null, 
    constraint amount_check check (amount > 0),
    type varchar(255) not null, 
    constraint type_check check (type in ('udhar', 'payment')),
    date date not null,
    user_id uuid not null,
    constraint fk_user foreign key (user_id) references users(user_id) ON DELETE CASCADE
);

create index idx_udhar on udhar (name, identity);