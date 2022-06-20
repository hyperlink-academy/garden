import { Client } from "faunadb";
import { createFileUpload } from "backend/fauna/resources/functions/create_file_upload";
import { getSessionById } from "backend/fauna/resources/functions/get_session_by_id";
import { Env } from ".";

async function computeHash(data: ArrayBuffer): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}
export type ImageUploadResponse = ReturnType<typeof handleFileUpload>;

const headers = {
  "Access-Control-Allow-Credentials": "true",
  "Content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
};

export const handleFileUpload = async (req: Request, env: Env) => {
  let body = await req.arrayBuffer();
  if (!body)
    return new Response(JSON.stringify({ success: false }), { headers });
  let token = req.headers.get("X-Authorization");
  if (!token)
    return new Response(
      JSON.stringify({
        success: false,
        error: "missing X-Authorization header",
      }),
      { headers, status: 401 }
    );
  let fauna = new Client({
    secret: env.env.FAUNA_KEY,
    domain: "db.us.fauna.com",
  });
  let session = await getSessionById(fauna, { id: token });
  try {
    let hash = await computeHash(body);

    if (!session)
      return new Response(JSON.stringify({ success: false }), { headers });

    let isMember = await env.factStore.scanIndex.ave(
      "space/member",
      session.studio
    );
    if (!isMember)
      return new Response(
        JSON.stringify({ success: false, error: "user is not a member" }),
        { headers }
      );

    let res = await createFileUpload(fauna, {
      hash: hash,
      space: env.id,
      createdAt: Date.now().toString(),
      token: token,
    });
    if (!res.success) {
      await env.env.USER_UPLOADS.delete(hash);
      return new Response(JSON.stringify({ success: false }), { headers });
    }
    await env.env.USER_UPLOADS.put(res.data.id, body);
    return new Response(
      JSON.stringify({ success: true, data: { id: res.data.id } }),
      { headers }
    );
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify(e), { headers });
  }
};
