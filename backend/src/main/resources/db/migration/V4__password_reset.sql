-- Password reset tokens and account deletion support
create table if not exists password_reset_tokens (
    id         uuid primary key,
    user_id    uuid not null references users(id) on delete cascade,
    token      varchar(255) not null unique,
    expires_at timestamp with time zone not null,
    used_at    timestamp with time zone,
    created_at timestamp with time zone not null default now()
);

create index if not exists idx_password_reset_tokens_token on password_reset_tokens(token);
create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens(user_id);
