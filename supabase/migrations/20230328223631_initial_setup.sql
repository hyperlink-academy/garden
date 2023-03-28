drop trigger if exists "on_auth_user_created" on "auth"."users";

drop function if exists "public"."handle_new_user"();

create table "public"."file_uploads" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "hash" text not null,
    "space" text not null,
    "deleted" boolean not null default false
);


create table "public"."old_identities" (
    "username" character varying not null,
    "studio" character varying not null
);


alter table "public"."old_identities" enable row level security;

CREATE UNIQUE INDEX file_uploads_hash_key ON public.file_uploads USING btree (hash);

CREATE UNIQUE INDEX file_uploads_pkey ON public.file_uploads USING btree (id);

CREATE UNIQUE INDEX old_identities_pkey ON public.old_identities USING btree (username);

CREATE UNIQUE INDEX old_identities_studio_key ON public.old_identities USING btree (studio);

alter table "public"."file_uploads" add constraint "file_uploads_pkey" PRIMARY KEY using index "file_uploads_pkey";

alter table "public"."old_identities" add constraint "old_identities_pkey" PRIMARY KEY using index "old_identities_pkey";

alter table "public"."file_uploads" add constraint "file_uploads_hash_key" UNIQUE using index "file_uploads_hash_key";

alter table "public"."file_uploads" add constraint "file_uploads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."file_uploads" validate constraint "file_uploads_user_id_fkey";

alter table "public"."old_identities" add constraint "old_identities_studio_key" UNIQUE using index "old_identities_studio_key";

create policy "Enable insert for users based on id"
on "public"."identity_data"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Enable read access for all users"
on "public"."identity_data"
as permissive
for select
to public
using (true);
