import { Bindings } from "backend";
import { makeRouter } from "backend/lib/api";
import { store } from "./fact_store";
import { graphqlServer } from "./graphql";
import { claimRoute } from "./routes/claim";
import { create_space_route } from "./routes/create_space";
import { delete_file_upload_route } from "./routes/delete_file_upload";
import { get_latest_message } from "./routes/get_latest_message";
import { get_share_code_route } from "./routes/get_share_code";
import { get_space_route } from "./routes/get_space";
import { join_route } from "./routes/join";
import { pullRoute } from "./routes/pull";
import { push_route } from "./routes/push";
import { connect } from "./socket";
import { handleFileUpload } from "./upload_file";

export type Env = {
  factStore: ReturnType<typeof store>;
  storage: DurableObjectStorage;
  poke: () => void;
  id: string;
  env: Bindings;
};

let routes = [
  pullRoute,
  push_route,
  claimRoute,
  create_space_route,
  get_space_route,
  get_share_code_route,
  get_latest_message,
  join_route,
  delete_file_upload_route,
];
export type SpaceRoutes = typeof routes;
let router = makeRouter(routes);

export class SpaceDurableObject implements DurableObject {
  version = 1;
  throttled = false;
  sockets: Array<{ socket: WebSocket; id: string }> = [];
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
        //TODO apply migrations here
      } catch (e) {
        console.log("CONSTRUCTOR ERROR", e);
      }
    });
  }
  async fetch(request: Request) {
    let url = new URL(request.url);
    let path = url.pathname.split("/");
    let ctx = {
      storage: this.state.storage,
      env: this.env,
      id: this.state.id.toString(),
      poke: () => {
        if (this.throttled) {
          return;
        }

        this.throttled = true;
        setTimeout(() => {
          this.sockets.forEach((socket) => {
            socket.socket.send(JSON.stringify({ type: "poke" }));
          });
          this.throttled = false;
        }, 100);
      },
      factStore: store(this.state.storage),
    };
    switch (path[1]) {
      case "upload_file": {
        return handleFileUpload(request, ctx);
      }
      case "socket": {
        return connect.bind(this)(request);
      }
      case "api": {
        return router(path[2], request, ctx);
      }
      case "graphql": {
        return graphqlServer(request, ctx);
      }
      default:
        return new Response("", { status: 404 });
    }
  }
}
