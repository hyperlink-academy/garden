create table "public"."user_space_unreads" (
    "user" text not null,
    "space" text not null,
    "unreads" bigint not null
);

alter table "public"."user_space_unreads" enable row level security;

CREATE UNIQUE INDEX user_space_unreads_pkey ON public.user_space_unreads USING btree ("user", space);

alter table "public"."user_space_unreads" add constraint "user_space_unreads_pkey" PRIMARY KEY using index "user_space_unreads_pkey";

alter table "public"."user_space_unreads" add constraint "user_space_unreads_space_fkey" FOREIGN KEY (space) REFERENCES space_data(do_id) ON DELETE CASCADE not valid;

alter table "public"."user_space_unreads" validate constraint "user_space_unreads_space_fkey";

alter table "public"."user_space_unreads" add constraint "user_space_unreads_user_fkey" FOREIGN KEY ("user") REFERENCES identity_data(studio) ON DELETE CASCADE not valid;

alter table "public"."user_space_unreads" validate constraint "user_space_unreads_user_fkey";
