import { Bindings } from "backend";
import { Lock } from "src/lock";
import { makeRouter } from "backend/lib/api";
import { store } from "./fact_store";
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
import { migrations } from "./migrations";
import { update_local_space_data_route } from "./internal_routes/update_local_space_data";
import { update_self_route } from "./routes/update_self";
import { delete_self_route } from "./routes/delete_self";

export type Env = {
  factStore: ReturnType<typeof store>;
  storage: DurableObjectStorage;
  poke: () => void;
  pushLock: Lock;
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
  update_self_route,
  delete_self_route,
];
let private_routes = [update_local_space_data_route];
export type PrivateSpaceRoutes = typeof private_routes;
export type SpaceRoutes = typeof routes;
let router = makeRouter(routes);
let internalRouter = makeRouter(private_routes);

export class SpaceDurableObject implements DurableObject {
  throttled = false;
  sockets: Array<{ socket: WebSocket; id: string }> = [];
  pushLock = new Lock();
  constructor(
    private readonly state: DurableObjectState,
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
          await pendingMigrations[i].run(this.state.storage);
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
  async fetch(request: Request) {
    let url = new URL(request.url);
    let path = url.pathname.split("/");
    let ctx = {
      storage: this.state.storage,
      env: this.env,
      pushLock: this.pushLock,
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
      factStore: store(this.state.storage, { id: this.state.id.toString() }),
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
      case "internal_api": {
        return internalRouter(path[2], request, ctx);
      }
      default:
        return new Response("", { status: 404 });
    }
  }
}
