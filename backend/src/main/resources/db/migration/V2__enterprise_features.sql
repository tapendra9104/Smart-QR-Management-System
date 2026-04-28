alter table users add column if not exists max_qr_codes integer;
alter table users add column if not exists max_api_keys integer;
alter table users add column if not exists max_webhooks integer;

alter table qr_codes add column if not exists starts_at timestamp with time zone;

alter table qr_scan_events add column if not exists is_suspicious boolean not null default false;
alter table qr_scan_events add column if not exists anomaly_reason varchar(255);

create table if not exists api_keys (
    id uuid primary key,
    user_id uuid not null,
    name varchar(120) not null,
    key_prefix varchar(24) not null,
    key_hash varchar(128) not null unique,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_api_keys_user foreign key (user_id) references users (id) on delete cascade
);

create table if not exists webhooks (
    id uuid primary key,
    user_id uuid not null,
    name varchar(160) not null,
    target_url text not null,
    signing_secret varchar(255) not null,
    subscribed_events text not null,
    is_active boolean not null default true,
    last_attempt_at timestamp with time zone,
    last_success_at timestamp with time zone,
    last_response_status integer,
    last_error text,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_webhooks_user foreign key (user_id) references users (id) on delete cascade
);

create index if not exists idx_api_keys_user_id on api_keys (user_id);
create index if not exists idx_api_keys_prefix on api_keys (key_prefix);
create index if not exists idx_webhooks_user_id on webhooks (user_id);
create index if not exists idx_webhooks_active on webhooks (is_active);
create index if not exists idx_qr_codes_starts_at on qr_codes (starts_at);
