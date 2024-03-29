import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { createClient } from "backend/lib/supabase";
import { z } from "zod";
import { space_data_query } from "./get_space_data";
let idk = z.union([
  z.object({ id: z.string() }),
  z.object({
    do_id: z.string(),
  }),
]);
export const get_studio_data_route = makeRoute({
  route: "get_studio_data",
  input: z.union([
    z.object({ id: z.string() }),
    z.object({
      do_id: z.string(),
    }),
  ]),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient(env);
    let query = supabase.from("studios").select(
      `*,
        members_in_studios(*, identity_data(*)),
        spaces_in_studios(*,
                          space_data(${space_data_query})
                         )`
    );
    if (msg.id) query = query.eq("id", msg.id);
    else query = query.eq("do_id", msg.do_id);
    let { data } = await query.single();
    if (data) {
      return {
        data: {
          success: true,
          //This is a super ugly hack to fix the type of space_data because
          //supabase says it's all nullable for some reason
          data: data as Omit<typeof data, "spaces_in_studios"> & {
            spaces_in_studios: Array<
              Omit<(typeof data)["spaces_in_studios"][0], "space_data"> & {
                space_data: NonNullable<
                  NonNull<(typeof data)["spaces_in_studios"][0]["space_data"]>
                >;
              }
            >;
          },
        },
      } as const;
    }

    return { data: { success: false } } as const;
  },
});
type NonNull<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

export type StudioData = Extract<
  Awaited<ReturnType<typeof get_studio_data_route.handler>>,
  { data: { success: true } }
>["data"]["data"];
