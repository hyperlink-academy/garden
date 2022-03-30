import { Bindings } from "backend";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { makeGETRoute } from "backend/lib/api";
import cookie from "cookie";
import { Client } from "faunadb";

export const SessionRoute = makeGETRoute({
  cmd: "session",
  handler: async (env: Bindings, request) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return { data: { loggedIn: false } } as const;
    let cookies = cookie.parse(cookieHeader);
    let auth = cookies.auth;
    if (!auth) return { data: { loggedIn: false } } as const;

    let session = await getSessionById(fauna, { id: auth });
    if (!session)
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
    return { data: { loggedIn: true, session } };
  },
});
