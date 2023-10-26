create table "public"."space_events" (
    "id" bigint generated by default as identity not null,
    "space" text not null,
    "at" timestamp with time zone not null default now(),
    "user" uuid not null,
    "event" text not null
);

alter table "public"."space_events" enable row level security;

CREATE UNIQUE INDEX space_events_pkey ON public.space_events USING btree (id);

alter table "public"."space_events" add constraint "space_events_pkey" PRIMARY KEY using index "space_events_pkey";

alter table "public"."space_events" add constraint "space_events_space_fkey" FOREIGN KEY (space) REFERENCES space_data(do_id) not valid;

alter table "public"."space_events" validate constraint "space_events_space_fkey";

alter table "public"."space_events" add constraint "space_events_user_fkey" FOREIGN KEY ("user") REFERENCES identity_data(id) not valid;

alter table "public"."space_events" validate constraint "space_events_user_fkey";