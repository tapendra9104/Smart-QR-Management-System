-- S7: Account lockout support
alter table users add column if not exists failed_login_attempts integer not null default 0;
alter table users add column if not exists locked_until timestamp with time zone;
