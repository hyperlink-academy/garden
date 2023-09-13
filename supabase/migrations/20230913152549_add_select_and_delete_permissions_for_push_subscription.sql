create policy "Members can read their own push subscriptions"
on "public"."push_subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));

create policy "Users can delete thier own push_subscriptions"
on "public"."push_subscriptions"
as permissive
for delete
to public
using ((auth.uid() = user_id));
