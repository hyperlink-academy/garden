alter table "public"."spaces_in_studios" add column "space_id" uuid;

alter table "public"."spaces_in_studios" add constraint "spaces_in_studios_space_id_fkey" FOREIGN KEY (space_id) REFERENCES space_data(id) ON DELETE CASCADE not valid;

alter table "public"."spaces_in_studios" validate constraint "spaces_in_studios_space_id_fkey";

update spaces_in_studios set space_id = (select id from space_data where do_id = space);

alter table "public"."spaces_in_studios" drop constraint "spaces_in_studios_pkey";

drop index if exists "public"."spaces_in_studios_pkey";

alter table "public"."spaces_in_studios" alter column "space_id" set not null;

CREATE UNIQUE INDEX spaces_in_studios_pkey ON public.spaces_in_studios USING btree (studio, space_id);

alter table "public"."spaces_in_studios" add constraint "spaces_in_studios_pkey" PRIMARY KEY using index "spaces_in_studios_pkey";

alter table "public"."spaces_in_studios" drop constraint "spaces_in_studios_space_fkey";

alter table "public"."spaces_in_studios" drop column "space";
