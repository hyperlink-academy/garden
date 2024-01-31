create or replace view "public"."space_authorizations" as  SELECT identity_data.id AS "user",
    identity_data.studio AS space_do_id
   FROM identity_data
UNION
 SELECT members_in_spaces.member AS "user",
    members_in_spaces.space_do_id
   FROM members_in_spaces
UNION
 SELECT members_in_studios.member AS "user",
    studios.do_id AS space_do_id
   FROM members_in_studios,
    studios
  WHERE (members_in_studios.studio = studios.id);
