import { app_event } from "backend/lib/analytics";
import { makeRoute, privateSpaceAPI } from "backend/lib/api";
import { authTokenVerifier, verifyIdentity } from "backend/lib/auth";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";

export const join_route = makeRoute({
  route: "join",
  input: z.object({
    code: z.string(),
    authToken: authTokenVerifier,
    studio: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let session = await verifyIdentity(env.env, msg.authToken);
    if (!session)
      return {
        data: { success: false, error: "Invalid session token" },
      } as const;

    let code = await env.storage.get<string>("meta-shareLink");
    if (code !== msg.code)
      return {
        data: { success: "false", error: "invalid share code" },
      } as const;

    let existingMember = await env.factStore.scanIndex.ave(
      "member/name",
      session.username
    );
    if (existingMember)
      return { data: { success: false, error: "Existing member" } } as const;

    let memberEntity = ulid();
    await Promise.all([
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "space/member",
        value: session.studio,
        positions: { aev: "a0" },
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "member/name",
        value: session.username,
        positions: { aev: "a0" },
      }),
    ]);
    let memberStudio = env.env.SPACES.get(
      env.env.SPACES.idFromString(session.studio)
    );
    let name = await env.factStore.scanIndex.aev("this/name");
    let thisEntity = name[0].entity;
    let description = await env.factStore.scanIndex.eav(
      thisEntity,
      "space/description"
    );
    let start_date = await env.factStore.scanIndex.eav(
      thisEntity,
      "space/start-date"
    );

    let end_date = await env.factStore.scanIndex.eav(
      thisEntity,
      "space/end-date"
    );

    let image = await env.factStore.scanIndex.eav(
      thisEntity,
      "space/door/uploaded-image"
    );

    let display_name = await env.factStore.scanIndex.eav(
      thisEntity,
      "space/display_name"
    );

    await privateSpaceAPI(memberStudio)("http://internal", "add_space_data", {
      spaceID: env.id,
      name: name[0].value,
      data: {
        image: image?.value,
        description: description?.value || "",
        start_date: start_date?.value.value || "",
        end_date: end_date?.value.value || "",
        studio: msg.studio,
        display_name: display_name?.value || "",
      },
    });
    env.poke();
    app_event(env.env, {
      event: "joined_space",
      user: session.username,
      spaceID: env.id,
    });
    return { data: { success: true } } as const;
  },
});
