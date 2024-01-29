alter table "public"."user_space_unreads" drop constraint "user_space_unreads_user_fkey";

alter table "public"."user_space_unreads" alter column "user" set data type uuid using "user"::uuid;

alter table "public"."user_space_unreads" add constraint "user_space_unreads_user_fkey" FOREIGN KEY ("user") REFERENCES identity_data(id) ON DELETE CASCADE not valid;

alter table "public"."user_space_unreads" validate constraint "user_space_unreads_user_fkey";
