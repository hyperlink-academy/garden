import { Bindings } from "backend";
import { Lock } from "src/lock";
import { makeRouter } from "backend/lib/api";
import { store } from "./fact_store";
import { claimRoute } from "./routes/claim";
import { delete_file_upload_route } from "./routes/delete_file_upload";
import { get_share_code_route } from "./routes/get_share_code";
import { join_route } from "./routes/join";
import { pullRoute } from "./routes/pull";
import { push_route } from "./routes/push";
import { handleFileUpload } from "./upload_file";
import { migrations } from "./migrations";
import { delete_self_route } from "./routes/delete_self";
import { post_feed_route } from "./routes/post_feed";
import { get_card_data_route } from "./routes/get_card_data";
import { createClient } from "backend/lib/supabase";

export type Env = {
  factStore: ReturnType<typeof store>;
  storage: DurableObjectStorage;
  state: DurableObjectState;
  poke: () => void;
  updateLastUpdated: () => void;
  pushLock: Lock;
  id: string;
  env: Bindings;
};

let routes = [
  get_card_data_route,
  pullRoute,
  push_route,
  claimRoute,
  get_share_code_route,
  join_route,
  delete_file_upload_route,
  delete_self_route,
  post_feed_route,
];
export type SpaceRoutes = typeof routes;
let router = makeRouter(routes);

export class SpaceDurableObject implements DurableObject {
  pushLock = new Lock();
  constructor(
    readonly state: DurableObjectState,
    private readonly env: Bindings
  ) {
    this.state.blockConcurrencyWhile(async () => {
      let lastAppliedMigration = await this.state.storage.get<string>(
        "meta-lastAppliedMigration"
      );
      let pendingMigrations = migrations.filter(
        (m) => !lastAppliedMigration || m.date > lastAppliedMigration
      );

      if (pendingMigrations.length === 0) return;
      try {
        for (let i = 0; i < pendingMigrations.length; i++) {
          await pendingMigrations[i].run(this.state.storage, {
            id: this.state.id.toString(),
            ...env,
          });
        }
      } catch (e) {
        console.log("CONSTRUCTOR ERROR", e);
      }
      await this.state.storage.put(
        "meta-lastAppliedMigration",
        pendingMigrations[pendingMigrations.length - 1].date
      );
    });
  }

  dbThrottle = false;
  async updateLastUpdated() {
    if (!this.dbThrottle) {
      this.dbThrottle = true;
      this.state.waitUntil(
        new Promise<void>((resolve) => {
          setTimeout(async () => {
            let supabase = createClient(this.env);
            await supabase
              .from("space_data")
              .update({ lastUpdated: new Date().toISOString() })
              .eq("do_id", this.state.id.toString());
            this.dbThrottle = false;
            resolve();
          }, 2000);
        })
      );
    }
  }

  pokeThrottle = false;
  async poke() {
    if (!this.pokeThrottle) {
      this.pokeThrottle = true;
      this.state.waitUntil(
        new Promise<void>((resolve) => {
          setTimeout(async () => {
            let supabase = createClient(this.env);
            let channel = supabase.channel(`space:${this.state.id.toString()}`);
            await channel.send({
              type: "broadcast",
              event: "poke",
              payload: { message: "poke" },
            });
            supabase.removeChannel(channel);
            this.pokeThrottle = false;
            resolve();
          }, 50);
        })
      );
    }
  }
  async fetch(request: Request) {
    let url = new URL(request.url);
    let path = url.pathname.split("/");
    let ctx = {
      storage: this.state.storage,
      env: this.env,
      pushLock: this.pushLock,
      state: this.state,
      id: this.state.id.toString(),
      updateLastUpdated: () => this.updateLastUpdated(),
      poke: () => {
        this.poke();
      },
      factStore: store(this.state.storage, { id: this.state.id.toString() }),
    };
    try {
      switch (path[1]) {
        case "upload_file": {
          return handleFileUpload(request, ctx);
        }
        case "api": {
          return router(path[2], request, ctx);
        }
        default:
          return new Response("", { status: 404 });
      }
    } catch (e) {
      console.log(e);
      return new Response("An uncaught exception occured", { status: 500 });
    }
  }
}
