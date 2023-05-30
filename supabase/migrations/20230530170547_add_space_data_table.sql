create table "public"."space_data" (
    "do_id" text not null,
    "display_name" text,
    "start_date" text,
    "end_date" text,
    "description" text,
    "image" text,
    "owner" uuid not null
);

alter table "public"."space_data" enable row level security;

CREATE UNIQUE INDEX space_data_pkey ON public.space_data USING btree (do_id);

alter table "public"."space_data" add constraint "space_data_pkey" PRIMARY KEY using index "space_data_pkey";

alter table "public"."space_data" add constraint "space_data_owner_fkey" FOREIGN KEY (owner) REFERENCES identity_data(id) not valid;

alter table "public"."space_data" validate constraint "space_data_owner_fkey";
