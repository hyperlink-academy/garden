import { z } from "zod";
import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { sign } from "src/sign";

import webpush from "web-push";
import { createClient } from "backend/lib/supabase";
import { HyperlinkNotification } from "worker";
let bodyParser = z.object({
  payload: z.string(),
  sig: z.string(),
});

export let webPushPayloadParser = z.object({
  senderStudio: z.string(),
  spaceID: z.string(),
  title: z.string(),
  message: z.object({
    id: z.string(),
    content: z.string(),
    topic: z.string(),
  }),
});

webpush.setVapidDetails(
  "mailto:contact@hyperlink.academy",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

let supabase = createClient(process.env as any);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    let body = bodyParser.safeParse(req.body);
    console.log(body);

    if (!body.success) {
      console.log(body.error);
      res.status(400);
      return;
    }

    let { payload, sig } = body.data;
    let signature = await sign(payload, process.env.RPC_SECRET || "");
    if (sig !== signature) {
      console.log("invalid signature");
      res.status(400);
      return;
    }
    let payloadBody = webPushPayloadParser.safeParse(JSON.parse(payload));
    if (!payloadBody.success) {
      console.log(payloadBody.error);
      res.status(400);
      return;
    }
    let { data } = payloadBody;

    let { data: spaceMembers, error } = await supabase
      .from("space_data")
      .select("members_in_spaces(identity_data(*, push_subscriptions(*)))")
      .eq("do_id", payloadBody.data.spaceID)
      .single();

    if (spaceMembers) {
      let notification: HyperlinkNotification = {
        type: "new-message",
        data: {
          senderUsername:
            spaceMembers.members_in_spaces.find(
              (f) => f.identity_data?.studio === data.senderStudio
            )?.identity_data?.username || "",
          ...payloadBody.data,
        },
      };
      for (let member of spaceMembers.members_in_spaces) {
        if (!member.identity_data) continue;
        for (let push_subscription of member.identity_data.push_subscriptions) {
          await webpush.sendNotification(
            push_subscription.push_subscription as any,
            JSON.stringify(notification)
          );
        }
      }
    }
    res.status(200);
    return;
  } catch (e) {
    console.log(e);
    res.status(400);
    return;
  }
};

export const signNode = (input: string, secret: string) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(Buffer.from(input));
  return hmac.digest("base64");
};
