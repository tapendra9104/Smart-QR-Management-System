create table if not exists users (
    id uuid primary key,
    email varchar(255) not null unique,
    full_name varchar(255),
    password_hash varchar(255) not null,
    role varchar(20) not null,
    enabled boolean not null default true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table if not exists refresh_tokens (
    id uuid primary key,
    token varchar(200) not null unique,
    user_id uuid not null,
    expires_at timestamp with time zone not null,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone not null,
    constraint fk_refresh_tokens_user foreign key (user_id) references users (id) on delete cascade
);

create table if not exists qr_codes (
    id uuid primary key,
    user_id uuid not null,
    name varchar(160) not null,
    short_code varchar(32) not null unique,
    content text not null,
    content_type varchar(20) not null,
    destination_url text,
    is_dynamic boolean not null,
    is_active boolean not null default true,
    style_json text not null,
    total_scans bigint not null default 0,
    expires_at timestamp with time zone,
    version bigint not null default 0,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint fk_qr_codes_user foreign key (user_id) references users (id) on delete cascade
);

create table if not exists qr_scan_events (
    id uuid primary key,
    qr_code_id uuid not null,
    user_id uuid not null,
    scanned_at timestamp with time zone not null,
    ip_address varchar(120),
    user_agent text,
    referer text,
    country varchar(120),
    city varchar(120),
    device_type varchar(40),
    browser varchar(80),
    os varchar(80),
    constraint fk_qr_scan_events_qr_code foreign key (qr_code_id) references qr_codes (id) on delete cascade,
    constraint fk_qr_scan_events_user foreign key (user_id) references users (id) on delete cascade
);

create table if not exists audit_logs (
    id uuid primary key,
    user_id uuid,
    action varchar(120) not null,
    entity_type varchar(120) not null,
    entity_id varchar(120),
    details_json text,
    created_at timestamp with time zone not null,
    constraint fk_audit_logs_user foreign key (user_id) references users (id) on delete set null
);

create index if not exists idx_refresh_tokens_user_id on refresh_tokens (user_id);
create index if not exists idx_qr_codes_user_id on qr_codes (user_id);
create index if not exists idx_qr_codes_short_code on qr_codes (short_code);
create index if not exists idx_qr_scan_events_user_id on qr_scan_events (user_id);
create index if not exists idx_qr_scan_events_qr_code_id on qr_scan_events (qr_code_id);
create index if not exists idx_qr_scan_events_scanned_at on qr_scan_events (scanned_at);
