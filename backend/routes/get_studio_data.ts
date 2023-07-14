import { createClient } from "@supabase/supabase-js";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import { z } from "zod";
export const get_studio_data_route = makeRoute({
  route: "get_studio_data",
  input: z.object({ id: z.string() }),
  handler: async (msg, env: Bindings) => {
    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_API_TOKEN
    );
    let { data } = await supabase
      .from("studios")
      .select(
        `*,
        members_in_studios(*, identity_data(username)),
        spaces_in_studios(*,
                          space_data(*,
                                     owner:identity_data!space_data_owner_fkey(*))
                         )`
      )
      .eq("id", msg.id)
      .single();
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
