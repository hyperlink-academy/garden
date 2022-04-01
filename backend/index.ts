import { makeRouter } from "./lib/api";
import { handleOptions } from "./lib/handleOptions";
import { LoginRoute } from "./routes/login";
import { LogoutRoute } from "./routes/logout";
import { SessionRoute } from "./routes/session";
import { SignupRoute } from "./routes/signup";
export { SpaceDurableObject } from "./SpaceDurableObject";

export default {
  fetch: handleRequest,
};

const Routes = {
  POST: [SignupRoute, LoginRoute, LogoutRoute, SessionRoute],
  GET: [],
};
export type WorkerRoutes = typeof Routes;

let router = makeRouter(Routes);

export type Bindings = {
  FAUNA_KEY: string;
  SPACES: DurableObjectNamespace;
};

async function handleRequest(request: Request, env: Bindings) {
  let url = new URL(request.url);
  let path = url.pathname.split("/");
  if (path[1] !== "v0")
    return new Response("You must use /v0/ for this API", { status: 404 });
  if (request.method === "OPTIONS") return handleOptions(request);
  if (path[2] === "api") return router(path[3], request, env);
  if (path[2] === "space") {
    let spaceID = path[3];
    let id = env.SPACES.idFromString(spaceID);
    let stub = env.SPACES.get(id);
    let newUrl = new URL(request.url);
    newUrl.pathname = "/" + path.slice(4).join("/");
    let result = await stub.fetch(
      new Request(newUrl.toString(), new Request(request))
    );
    return new Response(result.body, result);
  }
}
