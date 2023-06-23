import { makeRouter } from "./lib/api";
import { handleOptions } from "./lib/handleOptions";
import { add_space_to_studio } from "./routes/add_space_to_studio";
import { create_studio_route } from "./routes/create_studio";
import { get_identity_data_route } from "./routes/get_identity_data";
import { get_space_route } from "./routes/get_space";
import { get_space_data_route } from "./routes/get_space_data";
import { get_studio_data_route } from "./routes/get_studio_data";
import { LoginRoute } from "./routes/login";
import { SignupRoute } from "./routes/signup";
import { update_studio_data } from "./routes/update_studio_data";
export { SpaceDurableObject } from "./SpaceDurableObject";

export default {
  fetch: handleRequest,
};

const Routes = [
  SignupRoute,
  LoginRoute,
  get_identity_data_route,
  get_space_route,
  get_space_data_route,
  get_studio_data_route,
  add_space_to_studio,
  update_studio_data,
  create_studio_route,
];

export type WorkerRoutes = typeof Routes;

let router = makeRouter(Routes);

export type Bindings = {
  APP_EVENT_ANALYTICS: AnalyticsEngineDataset;
  SUPABASE_API_TOKEN: string;
  SUPABASE_URL: string;
  DAILY_API_KEY: string;
  SPACES: DurableObjectNamespace;
  USER_UPLOADS: R2Bucket;
};

async function handleRequest(
  request: Request,
  env: Bindings,
  context: ExecutionContext
) {
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
      // Construct the cache key from the cache URL
      const cacheKey = new Request(url.toString(), request);
      //@ts-ignore
      const cache: Cache = caches.default;

      // Check whether the value is already available in the cache
      // if not, you will need to fetch it from R2, and store it in the cache
      // for future access
      let response = await cache.match(cacheKey);

      const object = await env.USER_UPLOADS.get(path[3]);

      if (!object || !object.body) {
        return new Response("Object Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-control", "public, max-age=15552000");

      response = new Response(object.body, {
        headers,
      });
      context.waitUntil(cache.put(cacheKey, response.clone()));

      return response;
    } catch (e) {
      console.log(e);
    }
  }
}
