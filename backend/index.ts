import { handleOptions } from "./lib/handleOptions";
import { LoginRoute } from "./routes/login";
import { LogoutRoute } from "./routes/logout";
import { SessionRoute } from "./routes/session";
import { SignupRoute } from "./routes/signup";
export { SpaceDurableObject } from "./SpaceDurableObject";

export default {
  fetch: handleRequest,
};

export const POSTroutes = [SignupRoute, LoginRoute, LogoutRoute, SessionRoute];

export type Bindings = {
  FAUNA_KEY: string;
  SPACES: DurableObjectNamespace;
};

async function handleRequest(request: Request, env: Bindings) {
  let url = new URL(request.url);
  let path = url.pathname.split("/");
  if (path[1] !== "v0")
    return new Response("You must use /v0/ for this API", { status: 404 });

  let result;
  let status = 200;
  switch (request.method) {
    case "OPTIONS":
      return handleOptions(request);
    case "POST": {
      let handler = POSTroutes.find((f) => f.cmd === path[2]);
      if (!handler) {
        status = 404;
        result = { data: { error: `route /v0/${path[1]} not Found` } };
        break;
      }

      let body;
      if (handler.input)
        try {
          body = await request.json();
        } catch (e) {
          result = { data: { error: "Request body must be valid JSON" } };
          status = 400;
          break;
        }

      let msg = handler.input.safeParse(body);
      if (!msg.success) {
        status = 400;
        result = { data: JSON.stringify(msg.error) };
        break;
      }
      try {
        result = (await handler.handler(msg.data as any, env, request)) as {
          data: any;
          headers?: [string, string][];
        };
        break;
      } catch (e) {
        console.log(e);
        status = 500;
        result = {
          data: { error: "An error occured while handling this request" },
        };
        break;
      }
    }
    default:
      return new Response("Only OPTIONS/GET/POST supported");
  }

  let res = new Response(JSON.stringify(result.data), {
    status,
    headers: {
      "Access-Control-Allow-Credentials": "true",
      "Content-type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    },
  });
  result.headers?.forEach((h) => res.headers.append(h[0], h[1]));
  return res;
}
