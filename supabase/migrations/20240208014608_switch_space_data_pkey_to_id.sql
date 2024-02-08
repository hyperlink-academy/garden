alter table "public"."space_data" drop constraint "space_data_pkey";

drop index if exists "public"."space_data_pkey";

CREATE UNIQUE INDEX space_data_pkey ON public.space_data USING btree (id);

alter table "public"."space_data" add constraint "space_data_pkey" PRIMARY KEY using index "space_data_pkey";
