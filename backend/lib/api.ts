import { GETroutes, POSTroutes } from "backend";
import { ZodObject, ZodRawShape, z, ZodUndefined } from "zod";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export const callAPI = {
  query: async <T extends typeof GETroutes[number]["cmd"]>(
    route: string,
    cmd: T
  ) => {
    let result = await fetch(route + cmd, {
      method: "GET",
      credentials: "include",
    });
    return result.json() as Promise<
      UnwrapPromise<
        ReturnType<Extract<typeof GETroutes[number], { cmd: T }>["handler"]>
      >["data"]
    >;
  },
  mutation: async <T extends typeof POSTroutes[number]["cmd"]>(
    route: string,
    cmd: T,
    data: z.infer<Extract<typeof POSTroutes[number], { cmd: T }>["input"]>
  ) => {
    let result = await fetch(route + cmd, {
      body: JSON.stringify(data),
      method: "POST",
      credentials: "include",
      headers: { "Content-type": "application/json" },
    });
    return result.json() as Promise<
      UnwrapPromise<
        ReturnType<Extract<typeof POSTroutes[number], { cmd: T }>["handler"]>
      >["data"]
    >;
  },
};

export function makePOSTRoute<
  Cmd extends string,
  Input extends ZodObject<ZodRawShape> | ZodUndefined,
  Result extends {
    data: object;
    headers?: readonly (readonly [string, string])[];
  },
  Env extends {}
>(d: {
  cmd: Cmd;
  input: Input;
  handler: (msg: z.infer<Input>, env: Env, request: Request) => Promise<Result>;
}) {
  return d;
}

export function makeGETRoute<
  Cmd extends string,
  Result extends {
    data: object;
    headers?: readonly (readonly [string, string])[];
  },
  Env extends {}
>(d: { cmd: Cmd; handler: (env: Env, request: Request) => Promise<Result> }) {
  return d;
}
