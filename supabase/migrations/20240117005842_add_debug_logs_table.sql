create table "public"."debug_logs" (
    "id" bigint generated by default as identity not null,
    "data" jsonb,
    "time" timestamp with time zone default now()
);


alter table "public"."debug_logs" enable row level security;

CREATE UNIQUE INDEX debug_logs_pkey ON public.debug_logs USING btree (id);

alter table "public"."debug_logs" add constraint "debug_logs_pkey" PRIMARY KEY using index "debug_logs_pkey";
