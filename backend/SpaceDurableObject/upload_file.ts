import { Env } from ".";
import { verifyIdentity } from "backend/lib/auth";
import { createClient } from "backend/lib/supabase";

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
  let access_token = req.headers.get("X-Authorization-Access-Token");
  let refresh_token = req.headers.get("X-Authorization-Refresh-Token");

  const supabase = createClient(env.env);
  if (!access_token || !refresh_token)
    return new Response(
      JSON.stringify({
        success: false,
        error: "missing X-Authorization headers",
      }),
      { headers, status: 401 }
    );
  let session = await verifyIdentity(env.env, { access_token, refresh_token });
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

    let { data } = await supabase
      .from("file_uploads")
      .insert({
        hash: hash,
        space: env.id,
        user_id: session.id,
      })
      .select()
      .single();
    if (!data) {
      await env.env.USER_UPLOADS.delete(hash);
      return new Response(JSON.stringify({ success: false }), { headers });
    }
    await env.env.USER_UPLOADS.put(data.id, body);
    return new Response(
      JSON.stringify({ success: true, data: { id: data.id } }),
      { headers }
    );
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify(e), { headers });
  }
};
