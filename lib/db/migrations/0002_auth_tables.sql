create type "public"."auth_account_status" as enum ('active', 'disabled');

create table if not exists "public"."auth_accounts" (
  "id" uuid primary key default gen_random_uuid() not null,
  "email" text not null,
  "password_hash" text not null,
  "status" "public"."auth_account_status" not null default 'active',
  "full_name" text,
  "avatar_url" text,
  "role" "public"."user_role" not null default 'member',
  "email_verified_at" timestamp with time zone,
  "password_updated_at" timestamp with time zone not null default now(),
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

create unique index if not exists "auth_accounts_email_unique" on "public"."auth_accounts" using btree ("email");

create table if not exists "public"."auth_sessions" (
  "id" uuid primary key default gen_random_uuid() not null,
  "auth_account_id" uuid not null references "public"."auth_accounts"("id") on delete cascade,
  "access_token_hash" text not null,
  "refresh_token_hash" text not null,
  "expires_at" timestamp with time zone not null,
  "revoked_at" timestamp with time zone,
  "last_used_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now()
);

create unique index if not exists "auth_sessions_access_hash_idx" on "public"."auth_sessions" using btree ("access_token_hash");
create unique index if not exists "auth_sessions_refresh_hash_idx" on "public"."auth_sessions" using btree ("refresh_token_hash");
create index if not exists "auth_sessions_account_idx" on "public"."auth_sessions" using btree ("auth_account_id");

create table if not exists "public"."auth_password_resets" (
  "id" uuid primary key default gen_random_uuid() not null,
  "auth_account_id" uuid not null references "public"."auth_accounts"("id") on delete cascade,
  "token_hash" text not null,
  "expires_at" timestamp with time zone not null,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now()
);

create unique index if not exists "auth_password_resets_token_hash_idx" on "public"."auth_password_resets" using btree ("token_hash");
create index if not exists "auth_password_resets_account_idx" on "public"."auth_password_resets" using btree ("auth_account_id");
