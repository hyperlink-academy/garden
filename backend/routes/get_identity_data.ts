import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
import { space_data_query } from "./get_space_data";
export const get_identity_data_route = makeRoute({
  route: "get_identity_data",
  input: z.object({ name: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let { data, error } = await supabase
      .from("identity_data")
      .select(
        `*,
        members_in_spaces(
          space_data(${space_data_query})
        ),
        studios!studios_creator_fkey(${studio_query}),
        members_in_studios(studios(${studio_query})),
        owner:space_data!space_data_owner_fkey(*, owner:identity_data!space_data_owner_fkey(*))`
      )
      .eq("username", msg.name.toLowerCase())
      .single();
    console.log(error);
    if (data) {
      return { data: { success: true, data } } as const;
    }

    return { data: { success: false } } as const;
  },
});

const studio_query = `*,
        members_in_studios(*, identity_data(*)),
        spaces_in_studios(*)
  `;

export type IdentityData = Extract<
  Awaited<ReturnType<typeof get_identity_data_route.handler>>,
  { data: { success: true } }
>["data"]["data"];
