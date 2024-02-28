alter table "public"."communities" drop constraint "communities_name_key";

alter table "public"."communities" drop constraint "communities_pkey";

drop index if exists "public"."communities_name_key";

drop index if exists "public"."communities_pkey";

drop table "public"."communities";

alter table "public"."members_in_studios" add column "joined_at" timestamp with time zone default now();

alter table "public"."spaces_in_studios" add column "created_at" timestamp with time zone default now();

alter table "public"."studios" add column "created_at" timestamp with time zone default now();

alter table "public"."push_subscriptions" add column "created_at" timestamp with time zone default now();
