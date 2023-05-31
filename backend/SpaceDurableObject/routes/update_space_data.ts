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
    if (!owner || !data["space/display_name"])
      return { data: { success: false } };
    let owner_id = await supabase
      .from("identity_data")
      .select("id")
      .eq("studio", owner)
      .single();
    if (!owner_id.data) return { data: { success: false } };

    await supabase.from("space_data").upsert({
      do_id: env.id,
      owner: owner_id.data.id,
      display_name: data["space/display_name"],
      description: data["space/description"],
      start_date: data["space/start-date"]?.value,
      end_date: data["space/end-date"]?.value,
    });

    return {
      data: {
        ...data,
        owner,
        success: true,
      },
    };
  },
});
