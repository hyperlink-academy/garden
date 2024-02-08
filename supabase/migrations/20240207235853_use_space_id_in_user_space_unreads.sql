alter table "public"."user_space_unreads" add column "space_id" uuid;

alter table "public"."user_space_unreads" add constraint "user_space_unreads_space_id_fkey" FOREIGN KEY (space_id) REFERENCES space_data(id) ON DELETE CASCADE not valid;

alter table "public"."user_space_unreads" validate constraint "user_space_unreads_space_id_fkey";

update user_space_unreads set space_id = (select id from space_data where do_id = space);

alter table "public"."user_space_unreads" drop constraint "user_space_unreads_pkey";

drop index if exists "public"."user_space_unreads_pkey";

alter table "public"."user_space_unreads" alter column "space_id" set not null;

CREATE UNIQUE INDEX user_space_unreads_pkey ON public.user_space_unreads USING btree ("user", space_id);

alter table "public"."user_space_unreads" add constraint "user_space_unreads_pkey" PRIMARY KEY using index "user_space_unreads_pkey";

alter table "public"."user_space_unreads" drop constraint "user_space_unreads_space_fkey";

alter table "public"."user_space_unreads" drop column "space";
