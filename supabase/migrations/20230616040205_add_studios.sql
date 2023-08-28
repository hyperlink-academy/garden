create table "public"."members_in_studios" (
    "member" uuid not null,
    "studio" uuid not null
);

alter table "public"."members_in_studios" enable row level security;

create table "public"."studios" (
    "id" uuid not null default gen_random_uuid(),
    "creator" uuid not null,
    "description" text,
    "name" text not null,
    "do_id" text not null
);


alter table "public"."studios" enable row level security;

CREATE UNIQUE INDEX members_in_studios_pkey ON public.members_in_studios USING btree (member, studio);

CREATE UNIQUE INDEX studios_do_id_key ON public.studios USING btree (do_id);

CREATE UNIQUE INDEX studios_pkey ON public.studios USING btree (id);

alter table "public"."members_in_studios" add constraint "members_in_studios_pkey" PRIMARY KEY using index "members_in_studios_pkey";

alter table "public"."studios" add constraint "studios_pkey" PRIMARY KEY using index "studios_pkey";

alter table "public"."members_in_studios" add constraint "members_in_studios_member_fkey" FOREIGN KEY (member) REFERENCES identity_data(id) ON DELETE CASCADE not valid;

alter table "public"."members_in_studios" validate constraint "members_in_studios_member_fkey";

alter table "public"."members_in_studios" add constraint "members_in_studios_studio_fkey" FOREIGN KEY (studio) REFERENCES studios(id) ON DELETE CASCADE not valid;

alter table "public"."members_in_studios" validate constraint "members_in_studios_studio_fkey";

alter table "public"."studios" add constraint "studios_creator_fkey" FOREIGN KEY (creator) REFERENCES identity_data(id) not valid;

alter table "public"."studios" validate constraint "studios_creator_fkey";

alter table "public"."studios" add constraint "studios_do_id_key" UNIQUE using index "studios_do_id_key";


create table "public"."spaces_in_studios" (
    "studio" uuid not null,
    "space" text not null
);


alter table "public"."spaces_in_studios" enable row level security;

CREATE UNIQUE INDEX spaces_in_studios_pkey ON public.spaces_in_studios USING btree (studio, space);

alter table "public"."spaces_in_studios" add constraint "spaces_in_studios_pkey" PRIMARY KEY using index "spaces_in_studios_pkey";

alter table "public"."spaces_in_studios" add constraint "spaces_in_studios_space_fkey" FOREIGN KEY (space) REFERENCES space_data(do_id) ON DELETE CASCADE not valid;

alter table "public"."spaces_in_studios" validate constraint "spaces_in_studios_space_fkey";

alter table "public"."spaces_in_studios" add constraint "spaces_in_studios_studio_fkey" FOREIGN KEY (studio) REFERENCES studios(id) ON DELETE CASCADE not valid;

alter table "public"."spaces_in_studios" validate constraint "spaces_in_studios_studio_fkey";

create policy "Enable read access for all users"
on "public"."members_in_studios"
as permissive
for select
to public
using (true);
