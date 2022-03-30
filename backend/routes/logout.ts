import { z } from "zod";
import cookie from "cookie";
import { Bindings } from "backend";
import { Client } from "faunadb";
import { makePOSTRoute } from "backend/lib/api";
import { deleteSession } from "backend/fauna/resources/functions/delete_session";

export const LogoutRoute = makePOSTRoute({
  cmd: "logout",
  input: z.object({}),
  handler: async (_msg, env: Bindings, request: Request) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return { data: { loggedIn: false } } as const;
    let cookies = cookie.parse(cookieHeader);
    let auth = cookies.auth;
    if (!auth) return { data: { loggedIn: false } } as const;
    await deleteSession(fauna, { id: auth });
    return {
      data: { loggedIn: false },
      headers: [
        [
          "Set-Cookie",
          cookie.serialize("auth", "", {
            path: "/",
            sameSite: "none",
            httpOnly: true,
            secure: true,
            expires: new Date(Date.now() - 1000),
          }),
        ],
      ],
    };
  },
});
