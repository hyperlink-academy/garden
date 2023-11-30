alter table "public"."space_events" drop constraint "space_events_space_fkey";

alter table "public"."space_events" add constraint "space_events_space_fkey" FOREIGN KEY (space) REFERENCES space_data(do_id) ON DELETE CASCADE not valid;

alter table "public"."space_events" validate constraint "space_events_space_fkey";
