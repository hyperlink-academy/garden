import { makeRoute } from "backend/lib/api";
import { flag, ref } from "data/Facts";
import { ulid } from "src/ulid";
import { z } from "zod";
import { Env } from "..";
import { getMemberColor } from "./join";

let defaultReactions = [
  "😊",
  "😔",
  "❤️",
  "🎉",
  "🔥",
  "👀",
  "💀",
  "📌",
  "✅",
  "👍",
  "👎",
  "!!",
  "?",
];

export const claimRoute = makeRoute({
  route: "claim",
  input: z.object({
    ownerID: z.string(),
    ownerName: z.string(),
    type: z.union([z.literal("space"), z.literal("studio"), z.literal("user")]),
  }),
  handler: async (msg, env: Env) => {
    let creator = await env.storage.get("meta-creator");
    let space_type = await env.storage.get<string>("meta-space-type");
    let thisEntity = ulid();
    if (creator || space_type) return { data: { success: false } };
    let memberEntity = ulid();
    let canvasRoom = ulid();
    let collectionRoom = ulid();
    let chatRoom = ulid();
    let readmeEntity = ulid();
    let readmeCardPositionFact = ulid();

    await Promise.all([
      env.factStore.assertFact({
        entity: readmeEntity,
        attribute: "card/title",
        value: README_Title,
        positions: {},
      }),
      env.factStore.assertFact({
        entity: readmeEntity,
        attribute: "card/content",
        value: README.trim(),
        positions: {},
      }),
      env.factStore.assertFact({
        entity: canvasRoom,
        factID: readmeCardPositionFact,
        attribute: "desktop/contains",
        value: ref(readmeEntity),
        positions: {},
      }),
      env.factStore.assertFact({
        entity: readmeCardPositionFact,
        attribute: "card/position-in",
        value: { x: 64, y: 32, rotation: 0.2, size: "small", type: "position" },
        positions: {},
      }),
      env.factStore.assertFact({
        entity: canvasRoom,
        attribute: "home",
        value: flag(),
        positions: {},
      }),

      env.factStore.assertFact({
        entity: canvasRoom,
        attribute: "room/name",
        value: "Canvas",
        positions: { roomList: "a0" },
      }),
      env.factStore.assertFact({
        entity: canvasRoom,
        attribute: "room/type",
        value: "canvas",
        positions: {},
      }),

      env.factStore.assertFact({
        entity: collectionRoom,
        attribute: "room/name",
        value: "Collection",
        positions: { roomList: "c1" },
      }),
      env.factStore.assertFact({
        entity: collectionRoom,
        attribute: "room/type",
        value: "collection",
        positions: {},
      }),
      env.factStore.assertFact({
        entity: chatRoom,
        attribute: "room/name",
        value: "Chat",
        positions: { roomList: "t1" },
      }),
      env.factStore.assertFact({
        entity: chatRoom,
        attribute: "room/type",
        value: "chat",
        positions: {},
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "member/color",
        value: await getMemberColor(env.factStore),
        positions: {},
      }),

      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "space/member",
        value: msg.ownerID,
        positions: { aev: "a0" },
      }),
      env.factStore.assertFact({
        entity: memberEntity,
        attribute: "member/name",
        value: msg.ownerName,
        positions: { aev: "a0" },
      }),
      ...defaultReactions.map((r) =>
        env.factStore.assertFact({
          entity: thisEntity,
          attribute: "space/reaction",
          value: r,
          positions: {},
        })
      ),
      env.storage.put("meta-creator", msg.ownerID),
      env.storage.put("meta-space-type", msg.type),
    ]);
    return { data: { success: true } };
  },
});

const README_Title = `HYPERLINK README 📖✨📖 click here! 🌱`;
const README = `

Welcome to Hyperlink! This card will:

1) Show you how Hyperlink works
2) Help you get started making Spaces
3) Inspire you to try some fun experiments!

==For more info, click "i" in the sidebar==

# How Hyperlink Works

The very basics: make cards; organize them in rooms; talk about them together!

**Quick things to try:**

- make a room from the sidebar
- make a card (double click the canvas)
- add card content — image, linked cards, date, reactions — from the toolbar up top
- add a comment at the bottom of a card

**When you invite others, you'll also find:**

- audio calls, to hang & explore stuff together
- live presence, to see where others are
- unreads, to see what's new in the space
- notifications, for alerts on new activity

👯 You can invite collaborators at any time! But if you'd like to test things out first, we're glad to help with some feedback & experimentation.

🚨 Send us the invite link from the sidebar to contact@hyperlink.academy & one of us will join (you can delete the Space after testing!)

# Making Spaces

Quick checklist for setting up a Space:

1️⃣ **set a goal** — what are you aiming to do? what's the ideal outcome? how should it end?

2️⃣ **add things to explore** (readings? questions?) and make cards for each

3️⃣ **organize things** in rooms, e.g. canvas for ideas, collection for tasks, chat for…chat!

4️⃣ **decide what to do** e.g. weekly calls; sharing things and commenting on them

5️⃣ **invite a friend** (or a few) to join!

# Things to Try

Space are super flexible…you can design many *games* with these basic pieces:

- **reading club**: add readings & discuss
- **writing group**: share drafts and feedback
- **creative projects**: manage tasks; make things; share work in progress
- **prompts**: e.g. each share a daily drawing
- **interactive workshops** or other sessions

Click "i" in the sidebar for ==examples of real Spaces we've made== for inspiration ✨🔮

…and if you have questions or feedback, reach out any time! --> contact@hyperlink.academy

`;
