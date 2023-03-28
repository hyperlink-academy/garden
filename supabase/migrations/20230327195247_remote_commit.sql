CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$function$
;


