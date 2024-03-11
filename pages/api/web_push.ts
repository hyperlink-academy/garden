import { z } from "zod";
import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { sign } from "src/sign";

import webpush from "web-push";
import { createClient } from "backend/lib/supabase";
import { HyperlinkNotification } from "worker";
import { uuidToBase62 } from "src/uuidHelpers";
let bodyParser = z.object({
  payload: z.string(),
  sig: z.string(),
});

export let webPushPayloadParser = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("new-message"),
    senderStudio: z.string(),
    spaceID: z.string(),
    title: z.string(),
    message: z.object({
      id: z.string(),
      content: z.string(),
      topic: z.string(),
    }),
  }),
  z.object({
    type: z.literal("new-member"),
    username: z.string(),
    spaceID: z.string(),
  }),
]);

webpush.setVapidDetails(
  "mailto:contact@hyperlink.academy",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

let supabase = createClient({
  SUPABASE_API_TOKEN: process.env.SUPABASE_API_TOKEN as string,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
});

export default async function WebPushEndpoint(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    let { data: spaceData } = await supabase
      .from("space_data")
      .select(
        "display_name, name, id, studios(members_in_studios(identity_data(username, studio))), owner:identity_data!space_data_owner_fkey(username), members_in_spaces(identity_data(*, push_subscriptions(*)))"
      )
      .eq("do_id", payloadBody.data.spaceID)
      .single();

    if (spaceData) {
      let members = [
        ...spaceData.members_in_spaces,
        ...spaceData.studios.flatMap((s) => s.members_in_studios),
      ];
      let notification: HyperlinkNotification;
      if (data.type === "new-message") {
        let senderStudio = data.senderStudio;
        notification = {
          type: "new-message",
          data: {
            spaceName: spaceData.display_name || "Untitled Space",
            spaceURL: `/s/${spaceData.owner?.username}/s/${uuidToBase62(
              spaceData.id
            )}/${spaceData.display_name}`,
            senderUsername:
              members.find((f) => f.identity_data?.studio === senderStudio)
                ?.identity_data?.username || "",
            ...data,
          },
        };
      } else
        notification = {
          type: "joined-space",
          data: {
            spaceName: spaceData.display_name || "Untitled Space",
            spaceURL: `/s/${spaceData.owner?.username}/s/${spaceData.id}/${spaceData.display_name}`,
            spaceID: data.spaceID,
            newMemberUsername: data.username,
          },
        };

      for (let member of spaceData.members_in_spaces) {
        if (!member.identity_data) continue;
        if (
          notification.type === "new-message" &&
          member.identity_data.username === notification.data.senderUsername
        )
          continue;
        if (
          notification.type === "joined-space" &&
          member.identity_data.username === notification.data.newMemberUsername
        )
          continue;
        for (let push_subscription of member.identity_data.push_subscriptions) {
          await webpush
            .sendNotification(
              push_subscription.push_subscription as any,
              JSON.stringify(notification)
            )
            .catch((e) => {
              console.log(e);
            });
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
}

export const signNode = (input: string, secret: string) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(Buffer.from(input));
  return hmac.digest("base64");
};
