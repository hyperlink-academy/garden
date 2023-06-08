import { createClient } from "@supabase/supabase-js";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { Fact } from "data/Facts";
import { z } from "zod";
import { Env } from "..";

export const update_space_data_route = makeRoute({
  route: "get_space_data",
  input: z.object({}),
  handler: async (_msg, env: Env) => {
    let thisEntity = (await env.factStore.scanIndex.aev("this/name"))[0];
    if (!thisEntity)
      return { data: { success: false, error: "No this entity" } } as const;
    let attributes = [
      "space/display_name",
      "space/description",
      "space/start-date",
      "space/end-date",
      "space/door/uploaded-image",
      "space/name",
    ] as const;
    let data: {
      [k in (typeof attributes)[number]]: Fact<k>["value"] | undefined;
    } = Object.fromEntries(
      await Promise.all(
        attributes.map(async (attribute) => {
          let value = await env.factStore.scanIndex.eav(
            thisEntity.entity,
            attribute
          );
          return [attribute, value?.value];
        })
      )
    );

    let owner = await env.storage.get<string>("meta-creator");

    const supabase = createClient<Database>(
      env.env.SUPABASE_URL,
      env.env.SUPABASE_API_TOKEN
    );

    let spaceNames = await env.factStore.scanIndex.aev(
      "space/local-unique-name"
    );
    for (let spaceName of spaceNames) {
      let spaceID = await env.factStore.scanIndex.eav(
        spaceName.entity,
        "space/id"
      );
      if (spaceID) {
        await supabase
          .from("space_data")
          .update({
            name: spaceName.value,
          })
          .eq("do_id", spaceID.value);
      }
    }

    if (!owner || !data["space/display_name"])
      return { data: { success: false } };

    let members = await env.factStore.scanIndex.aev("space/member");
    for (let member of members) {
      let { data: memberID } = await supabase
        .from("identity_data")
        .select("id")
        .eq("studio", member.value)
        .single();
      if (!memberID) continue;
      await supabase.from("members_in_spaces").insert({
        space_do_id: env.id,
        member: memberID.id,
      });
    }

    await supabase
      .from("space_data")
      .update({
        image:
          data["space/door/uploaded-image"]?.filetype === "image"
            ? data["space/door/uploaded-image"]?.id
            : null,
        default_space_image:
          data["space/door/uploaded-image"]?.filetype === "external_image"
            ? data["space/door/uploaded-image"]?.url
            : null,
        display_name: data["space/display_name"],
        description: data["space/description"],
        start_date: data["space/start-date"]?.value,
        end_date: data["space/end-date"]?.value,
      })
      .eq("do_id", env.id);

    return {
      data: {
        ...data,
        owner,
        success: true,
      },
    };
  },
});
