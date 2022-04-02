import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";

export const create_space_route = makeRoute({
  route: "create_space",
  input: z.object({ name: z.string(), token: z.string() }),
  handler: async (msg, env: Env) => {
    let fauna = new Client({
      secret: env.env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let creator = await env.storage.get("meta-creator");
    let session = await getSessionById(fauna, { id: msg.token });
    console.log(session);
    console.log(creator);
    if (!session || session.studio !== creator || !creator)
      return {
        data: { success: false, error: "unauthorized" },
      } as const;

    let existingSpace = await env.factStore.scanIndex.ave(
      "space/name",
      msg.name
    );

    if (existingSpace)
      return { data: { success: false, error: "existing space" } } as const;

    let newSpace = env.env.SPACES.newUniqueId();
    let stub = env.env.SPACES.get(newSpace);
    await internalSpaceAPI(stub)("http://internal", "claim", {
      ownerID: session.studio,
      name: msg.name,
      ownerName: session.username,
    });
    let newEntity = ulid();
    await Promise.all([
      env.factStore.assertFact({
        entity: newEntity,
        attribute: "space/name",
        value: msg.name,
        positions: {},
      }),
      env.factStore.assertFact({
        entity: newEntity,
        attribute: "space/studio",
        value: session.username,
        positions: {},
      }),
      env.factStore.assertFact({
        entity: newEntity,
        attribute: "space/id",
        value: newSpace.toString(),
        positions: {},
      }),
    ]);
    return { data: { success: true } } as const;
  },
});
