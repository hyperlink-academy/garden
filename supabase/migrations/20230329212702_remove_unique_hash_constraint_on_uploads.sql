alter table "public"."file_uploads" drop constraint "file_uploads_hash_key";

drop index if exists "public"."file_uploads_hash_key";
