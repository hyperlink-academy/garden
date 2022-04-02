import { WorkerRoutes } from "backend";
import { SpaceRoutes } from "backend/SpaceDurableObject";
import { ZodObject, ZodRawShape, z } from "zod";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export const workerAPI = makeAPIClient<WorkerRoutes>();
export const spaceAPI = makeAPIClient<SpaceRoutes>();
export const internalSpaceAPI = (stub:DurableObjectStub) => makeAPIClient<SpaceRoutes>(stub.fetch.bind(stub))

export type ExtractResponse<
  T extends { handler: (...d: any[]) => Promise<{ data: any }> }
> = UnwrapPromise<ReturnType<T["handler"]>>["data"];
export function makeAPIClient<R extends Routes<any>>(f?: Fetcher["fetch"]) {
  let fetcher = fetch;
  if (f) fetcher = f;
  return {
    mutation: async <T extends R["POST"][number]["route"]>(
      path: string,
      route: T,
      data: z.infer<Extract<R["POST"][number], { route: T }>["input"]>
    ) => {
      let result = await fetcher(path + "/api/" + route, {
        body: JSON.stringify(data),
        method: "POST",
        headers: { "Content-type": "application/json" },
      });
      return result.json() as Promise<
        UnwrapPromise<
          ReturnType<Extract<R["POST"][number], { route: T }>["handler"]>
        >["data"]
      >;
    },
  };
}

type Routes<Env> = {
  POST: POSTRoute<string, any, any, Env>[];
  GET: ReturnType<typeof makeGETRoute>[];
};
export const makeRouter = <Env>(routes: Routes<Env>) => {
  return async (route: string, request: Request, env: Env) => {
    let status = 200;
    let result;
    switch (request.method) {
      case "POST": {
        let handler = routes.POST.find((f) => f.route === route);
        if (!handler) {
          status = 404;
          result = { data: { error: `route ${route} not Found` } };
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
        status = 404;
        result = { data: { error: "Only POST/GET Supported" } };
    }

    let res = new Response(JSON.stringify(result.data), {
      status,
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Content-type": "application/json;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      },
    });
    result.headers?.forEach((h) => res.headers.append(h[0], h[1]));
    return res;
  };
};

type POSTRoute<
  Cmd extends string,
  Input extends ZodObject<ZodRawShape>,
  Result extends {
    data: object;
    headers?: readonly (readonly [string, string])[];
  },
  Env extends {}
> = {
  route: Cmd;
  input: Input;
  handler: (msg: z.infer<Input>, env: Env, request: Request) => Promise<Result>;
};
export function makePOSTRoute<
  Cmd extends string,
  Input extends ZodObject<ZodRawShape>,
  Result extends {
    data: object;
    headers?: readonly (readonly [string, string])[];
  },
  Env extends {}
>(d: POSTRoute<Cmd, Input, Result, Env>) {
  return d;
}

type GETRoute<
  Route extends string,
  Result extends {
    data: object;
    headers?: readonly (readonly [string, string])[];
  },
  Env extends {}
> = { route: Route; handler: (env: Env, request: Request) => Promise<Result> };

export function makeGETRoute<
  Route extends string,
  Result extends {
    data: object;
    headers?: readonly (readonly [string, string])[];
  },
  Env extends {}
>(d: GETRoute<Route, Result, Env>) {
  return d;
}
