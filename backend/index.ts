import { makeRouter } from "./lib/api";
import { handleOptions } from "./lib/handleOptions";
import { claim_card_route } from "./routes/claim_card";
import { create_community_route } from "./routes/create_community";
import { create_signup_code_route } from "./routes/create_signup_code";
import { get_signup_token_route } from "./routes/get_signup_code";
import { get_space_route } from "./routes/get_space";
import { getStudioRoute, get_community_route } from "./routes/get_studio";
import { LoginRoute } from "./routes/login";
import { LogoutRoute } from "./routes/logout";
import { SessionRoute } from "./routes/session";
import { SignupRoute } from "./routes/signup";
export { SpaceDurableObject } from "./SpaceDurableObject";

export default {
  fetch: handleRequest,
};

const Routes = [
  SignupRoute,
  LoginRoute,
  LogoutRoute,
  SessionRoute,
  getStudioRoute,
  get_community_route,
  get_space_route,
  get_signup_token_route,
  claim_card_route,
  create_signup_code_route,
  create_community_route,
];
export type WorkerRoutes = typeof Routes;

let router = makeRouter(Routes);

export type Bindings = {
  FAUNA_KEY: string;
  SPACES: DurableObjectNamespace;
  USER_UPLOADS: R2Bucket;
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

    if (path[4] === "internal_api")
      return new Response("Internal only", { status: 401 });
    newUrl.pathname = "/" + path.slice(4).join("/");

    let result = await stub.fetch(
      new Request(newUrl.toString(), new Request(request))
    );
    return new Response(result.body, result);
  }
  if (path[2] === "static") {
    try {
      const object = await env.USER_UPLOADS.get(path[3]);

      if (!object || !object.body) {
        return new Response("Object Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);

      return new Response(object.body, {
        headers,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
