import { Bindings } from "backend";
import { makeRouter } from "backend/lib/api";
import { store } from "./fact_store";
import { init } from "./initialize";
import { claimRoute } from "./routes/claim";
import { create_space_route } from "./routes/create_space";
import { pullRoute } from "./routes/pull";

export type Env = {
  factStore: ReturnType<typeof store>;
  storage: DurableObjectStorage;
  env: Bindings;
};

let routes = { POST: [pullRoute, claimRoute, create_space_route], GET: [] };
export type SpaceRoutes = typeof routes;
let router = makeRouter(routes);

export class SpaceDurableObject implements DurableObject {
  version = 1;
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Bindings
  ) {
    this.state.blockConcurrencyWhile(async () => {
      let version =
        (await this.state.storage.get<number>("meta-lastVersion")) || 0;
      if (this.version <= version) return;
      await this.state.storage.deleteAll();
      this.state.storage.put("meta-lastVersion", this.version);
      try {
        await init(this.state.storage);
      } catch (e) {
        console.log("CONSTRUCTOR ERROR", e);
      }
    });
  }
  async fetch(request: Request) {
    let url = new URL(request.url);
    let path = url.pathname.split("/");
    if (path[1] === "api")
      return router(path[2], request, {
        storage: this.state.storage,
        env: this.env,
        factStore: store(this.state.storage),
      });
    return new Response("", { status: 404 });
  }
}
