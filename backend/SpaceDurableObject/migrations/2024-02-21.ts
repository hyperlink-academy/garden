import { Bindings } from "backend";
import { createClient } from "backend/lib/supabase";

export default {
  date: "2024-01-20",
  run: async function (
    storage: DurableObjectStorage,
    env: Bindings & { id: string }
  ) {
    let supabase = createClient(env);
    let code = await storage.get<string>("meta-shareLink");

    await supabase
      .from("space_data")
      .update({ join_code: code })
      .eq("do_id", env.id);
    await supabase
      .from("studios")
      .update({ join_code: code })
      .eq("do_id", env.id);
  },
};
