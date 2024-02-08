alter table "public"."space_events" add column "space_id" uuid;

alter table "public"."space_events" add constraint "space_events_space_id_fkey" FOREIGN KEY (space_id) REFERENCES space_data(id) ON DELETE CASCADE not valid;

alter table "public"."space_events" validate constraint "space_events_space_id_fkey";

update space_events set space_id = (select id from space_data where do_id = space);

alter table "public"."space_events" drop constraint "space_events_pkey";

drop index if exists "public"."space_events_pkey";

alter table "public"."space_events" alter column "space_id" set not null;

alter table "public"."space_events" drop constraint "space_events_space_fkey";

alter table "public"."space_events" drop column "space";
