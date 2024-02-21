alter table "public"."members_in_spaces" add column "space_id" uuid;

alter table "public"."members_in_spaces" add constraint "members_in_spaces_space_id_fkey" FOREIGN KEY (space_id) REFERENCES space_data(id) ON DELETE CASCADE not valid;

alter table "public"."members_in_spaces" validate constraint "members_in_spaces_space_id_fkey";

update members_in_spaces set space_id = (select id from space_data where do_id = space_do_id);

alter table "public"."members_in_spaces" drop constraint "members_in_spaces_pkey";

drop index if exists "public"."members_in_spaces_pkey";

alter table "public"."members_in_spaces" alter column "space_id" set not null;

CREATE UNIQUE INDEX members_in_spaces_pkey ON public.members_in_spaces USING btree (member, space_id);

alter table "public"."members_in_spaces" add constraint "members_in_spaces_pkey" PRIMARY KEY using index "members_in_spaces_pkey";

alter table "public"."members_in_spaces" drop constraint "members_in_spaces_space_do_id_fkey";

alter table "public"."members_in_spaces" drop column "space_do_id";
