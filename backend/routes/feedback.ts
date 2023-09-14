import { z } from "zod";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";

export const feedback_route = makeRoute({
  route: "feedback",
  input: z.object({
    email: z.string().email().optional(),
    page: z.string().optional(),
    content: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": env.POSTMARK_API_TOKEN,
      },
      body: JSON.stringify({
        To: "contact@hyperlink.academy",
        From: "feedback@hyperlink.academy",
        Subject: `Feedback from ${msg.email}`,
        ReplyTo: msg.email,
        TextBody: `Page: ${msg.page}\n\n${msg.content}`,
      }),
    });
    console.log(await res.json());
    return { data: {} };
  },
});
