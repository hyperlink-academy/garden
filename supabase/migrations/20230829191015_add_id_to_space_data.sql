alter table "public"."space_data" add column "id" uuid not null default gen_random_uuid();

CREATE UNIQUE INDEX space_data_id_key ON public.space_data USING btree (id);

alter table "public"."space_data" add constraint "space_data_id_key" UNIQUE using index "space_data_id_key";
