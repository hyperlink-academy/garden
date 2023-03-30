alter table "public"."old_identities" add column "email" text not null;

CREATE UNIQUE INDEX old_identities_email_key ON public.old_identities USING btree (email);

CREATE UNIQUE INDEX old_identities_username_key ON public.old_identities USING btree (username);

alter table "public"."old_identities" add constraint "old_identities_email_key" UNIQUE using index "old_identities_email_key";

alter table "public"."old_identities" add constraint "old_identities_username_key" UNIQUE using index "old_identities_username_key";
