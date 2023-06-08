create table "public"."members_in_spaces" (
    "space_do_id" text not null,
    "member" uuid not null
);

alter table "public"."members_in_spaces" enable row level security;

CREATE UNIQUE INDEX members_in_spaces_pkey ON public.members_in_spaces USING btree (space_do_id, member);

alter table "public"."members_in_spaces" add constraint "members_in_spaces_pkey" PRIMARY KEY using index "members_in_spaces_pkey";

alter table "public"."members_in_spaces" add constraint "members_in_spaces_member_fkey" FOREIGN KEY (member) REFERENCES identity_data(id) ON DELETE CASCADE not valid;

alter table "public"."members_in_spaces" validate constraint "members_in_spaces_member_fkey";

alter table "public"."members_in_spaces" add constraint "members_in_spaces_space_do_id_fkey" FOREIGN KEY (space_do_id) REFERENCES space_data(do_id) ON DELETE CASCADE not valid;

alter table "public"."members_in_spaces" validate constraint "members_in_spaces_space_do_id_fkey";
