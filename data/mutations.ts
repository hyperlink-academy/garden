import { calculateUnreads, markUnread } from "src/markUnread";
import { Attribute, FilterAttributes, ReferenceAttributes } from "./Attributes";
import { Fact, ref } from "./Facts";
import { Message } from "./Messages";
import { z } from "zod";
import { webPushPayloadParser } from "pages/api/web_push";
import { sign } from "src/sign";
import { ulid } from "src/ulid";
import { WriteTransaction } from "@rocicorp/reflect";
import { getMemberColor } from "backend/SpaceDurableObject/routes/join";
import { generateKeyBetween } from "src/fractional-indexing";
import { app_event } from "backend/lib/analytics";
import { createClient } from "backend/lib/supabase";

export type MutationContext = {
  tx: WriteTransaction;
  auth?: { userID: string; userStudio: string };
  assertEmphemeralFact: <A extends keyof FilterAttributes<{ ephemeral: true }>>(
    clientID: string,
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions"> & {
      factID?: string;
    }
  ) => Promise<{ success: boolean }>;
  postMessage: (message: Message) => Promise<{ success: boolean }>;
  assertFact: <A extends keyof Attribute>(
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions"> & {
      factID?: string;
    },
    undoAction?: boolean
  ) => Promise<{ success: false } | { success: true; factID: string }>;
  updateFact: (
    id: string,
    data: Partial<Fact<keyof Attribute>>,
    undoAction?: boolean
  ) => Promise<{ success: boolean }>;
  runOnServer: (
    fn: (
      id: string,
      env: {
        NEXT_API_URL: string;
        RPC_SECRET: string;
        SUPABASE_API_TOKEN: string;
        SUPABASE_URL: string;
      },
      userID: string
    ) => Promise<void>
  ) => Promise<void>;
  retractFact: (id: string, undoAction?: boolean) => Promise<void>;
  retractEphemeralFact: (clientID: string, id: string) => Promise<void>;
  scanIndex: {
    vae: <A extends keyof ReferenceAttributes>(
      entity: string,
      attribute?: A
    ) => Promise<Fact<A>[]>;
    eav: <A extends keyof Attribute | null>(
      entity: string,
      attribute: A
    ) => Promise<CardinalityResult<A>>;
    aev: <A extends keyof Attribute>(
      attribute: A,
      entity?: string
    ) => Promise<Fact<A>[]>;
    ave: <A extends keyof UniqueFacts>(
      attribute: A,
      value: string
    ) => Promise<Fact<A> | undefined>;
  };
};

type UniqueFacts = {
  [A in keyof Attribute as Attribute[A]["unique"] extends true
    ? A
    : never]: Attribute[A];
};

type OptionalAttribute<A extends keyof Attribute | null> =
  A extends keyof Attribute ? A : keyof Attribute;
export type CardinalityResult<A extends keyof Attribute | null> =
  Attribute[OptionalAttribute<A>] extends {
    cardinality: "one";
  }
    ? Fact<OptionalAttribute<A>> | null
    : Fact<OptionalAttribute<A>>[];

type Mutation<T> = (args: T, ctx: MutationContext) => Promise<void>;

const addCardToDesktop: Mutation<{
  entity: string;
  factID: string;
  desktop: string;
  position: { x: number; y: number; rotation: number; size: "big" | "small" };
}> = async (args, ctx) => {
  let id = await ctx.assertFact({
    factID: args.factID,
    entity: args.desktop,
    attribute: "desktop/contains",
    value: ref(args.entity),
    positions: {},
  });
  if (!id.success) return;
  await ctx.assertFact({
    entity: args.factID,
    attribute: "card/position-in",
    value: { type: "position", ...args.position },
    positions: {},
  });
};

const removeCardFromDesktopOrCollection: Mutation<{
  factID?: string;
  entityID: string;
}> = async (args, ctx) => {
  let references = await ctx.scanIndex.vae(args.entityID);
  let facts = await ctx.scanIndex.eav(args.entityID, null);
  let deleteable = facts.reduce((acc, f) => {
    return (
      acc &&
      (!f.value ||
        f.attribute === "card/created-by" ||
        f.attribute === "card/unread-by") &&
      !f.schema.ephemeral
    );
  }, true);
  if (
    deleteable &&
    references.filter((f) => !f.schema.ephemeral).length === 1
  ) {
    await Promise.all(
      facts.concat(references).map((f) => ctx.retractFact(f.id))
    );
  } else {
    if (args.factID) await ctx.retractFact(args.factID);
  }
  if (args.factID) {
    let position = await ctx.scanIndex.eav(args.factID, "card/position-in");
    if (position) await ctx.retractFact(position.id);
  }
};

const updatePositionInDesktop: Mutation<{
  parent: string;
  factID: string;
  size?: "big" | "small";
  dx: number;
  dy: number;
  da: number;
}> = async (args, ctx) => {
  let positionFact = await ctx.scanIndex.eav(args.factID, "card/position-in");
  if (!positionFact) {
    await ctx.assertFact({
      entity: args.factID,
      value: {
        type: "position",
        x: args.dx,
        y: args.dy,
        rotation: args.da,
        size: args.size || "small",
      },
      attribute: "card/position-in",
      positions: {},
    });
  } else {
    let x = positionFact.value.x;
    let y = positionFact.value.y;
    let a = positionFact.value.rotation;
    await ctx.updateFact(positionFact.id, {
      value: {
        ...positionFact.value,
        x: x + args.dx,
        y: args.dy + y,
        rotation: a + args.da,
        size: args.size || positionFact.value.size,
      },
    });
  }
};

const updatePositions: Mutation<{
  newPositions: [string, string][];
  positionKey: string;
}> = async (args, ctx) => {
  for (let [factID, position] of args.newPositions) {
    await ctx.updateFact(factID, {
      positions: { [args.positionKey]: position },
    });
  }
};

const addCardToSection: Mutation<{
  factID: string;
  cardEntity: string;
  parent: string;
  section: keyof ReferenceAttributes;
  positions: { [k: string]: string };
}> = async (args, ctx) => {
  let existingCards = await ctx.scanIndex.eav(
    args.parent,
    args.section as "arbitrarySectionReferenceType"
  );
  let existing = existingCards.find((f) => f.value.value === args.cardEntity);
  if (existing && !existing.retracted) return;
  await ctx.assertFact({
    factID: args.factID,
    entity: args.parent,
    attribute: args.section as "arbitrarySectionReferenceType",
    value: ref(args.cardEntity),
    positions: args.positions,
  });
};

const createCard: Mutation<{
  entityID: string;
  title: string;
  memberEntity: string;
}> = async (args, ctx) => {
  await ctx.assertFact({
    entity: args.entityID,
    attribute: "card/created-by",
    value: ref(args.memberEntity),
    positions: {},
  });
  await ctx.assertFact({
    entity: args.entityID,
    attribute: "card/title",
    value: args.title,
    positions: {},
  });
  await markUnread(
    {
      attribute: "card/unread-by",
      memberEntity: args.memberEntity,
      entityID: args.entityID,
    },
    ctx
  );
  await ctx.runOnServer(async (id, env, userID) => {
    await app_event(env, {
      event: "created_card",
      spaceID: id,
      user: userID,
    });
  });
};

export type FactInput = {
  [A in keyof Attribute]: Pick<
    Fact<A>,
    "attribute" | "entity" | "value" | "positions"
  > & { factID?: string };
}[keyof Attribute];
const assertFact: Mutation<
  (FactInput | FactInput[]) & { undoAction?: boolean }
> = async (args, ctx) => {
  await Promise.all(
    [args].flat().map((f) => {
      return ctx.assertFact({ ...f }, args.undoAction);
    })
  );
};

const assertEmphemeralFact: Mutation<
  Pick<
    Fact<keyof FilterAttributes<{ ephemeral: true }>>,
    "entity" | "attribute" | "value" | "positions"
  > & { clientID: string }
> = async (args, ctx) => {
  await ctx.assertEmphemeralFact(args.clientID, { ...args });
};

const retractFact: Mutation<{ id: string; undoAction?: boolean }> = async (
  args,
  ctx
) => {
  await ctx.retractFact(args.id, args.undoAction);
};

const updateFact: Mutation<{
  id: string;
  undoAction?: boolean;
  data: Partial<Fact<any>>;
}> = async (args, ctx) => {
  await ctx.updateFact(args.id, args.data, args.undoAction);
};

const updateContentFact: Mutation<
  Pick<Fact<"card/content">, "attribute" | "entity" | "value" | "positions">
> = async (args, ctx) => {
  console.log("????");
  await ctx.assertFact(args);
};

const updateTitleFact: Mutation<{
  attribute: "card/title";
  entity: string;
  value: string;
}> = async (args, ctx) => {
  let existingLinks = await ctx.scanIndex.vae(
    args.entity,
    "card/inline-links-to"
  );
  let oldTitle = await ctx.scanIndex.eav(args.entity, "card/title");
  if (!oldTitle) {
    await ctx.assertFact({ ...args, positions: {} });
    return;
  }
  for (let link of existingLinks) {
    let content = await ctx.scanIndex.eav(link.entity, "card/content");
    if (!content) continue;
    await ctx.assertFact({
      entity: link.entity,
      attribute: "card/content",
      value: content.value.replace(
        `[[${oldTitle.value}]]`,
        `[[${args.value}]]`
      ),
      positions: {},
    });
  }
  await ctx.assertFact({ ...args, positions: {} });
};

const replyToDiscussion: Mutation<{
  discussion: string;
  message: Message;
}> = async (args, ctx) => {
  let messageCount = await ctx.scanIndex.eav(
    args.discussion,
    "discussion/message-count"
  );
  await ctx.assertFact({
    entity: args.discussion,
    attribute: "discussion/message-count",
    value: messageCount ? messageCount.value + 1 : 1,
    positions: {},
  });

  await markUnread(
    {
      entityID: args.discussion,
      memberEntity: args.message.sender,
      attribute: "discussion/unread-by",
    },
    ctx
  );

  await ctx.postMessage(args.message);
  let senderStudio = await ctx.scanIndex.eav(
    args.message.sender,
    "space/member"
  );
  await ctx.runOnServer(async (id, env, userID) => {
    if (!senderStudio) return;

    let title: Fact<"room/name" | "card/title"> | null =
      await ctx.scanIndex.eav(args.discussion, "card/title");
    if (!title) title = await ctx.scanIndex.eav(args.discussion, "room/name");

    await app_event(env, {
      event: "sent_message",
      spaceID: id,
      user: userID,
    });

    try {
      let payload: z.TypeOf<typeof webPushPayloadParser> = {
        type: "new-message",
        title: title?.value || "Untitled",
        senderStudio: senderStudio.value,
        message: args.message,
        spaceID: id,
      };
      let payloadString = JSON.stringify(payload);
      fetch(`${env.NEXT_API_URL}/api/web_push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: payloadString,
          sig: await sign(payloadString, env.RPC_SECRET),
        }),
      });
    } catch (e) {
      console.log(e);
    }
  });
};

const createRoom: Mutation<{
  entity: string;
  type: "canvas" | "collection" | "chat";
  name: string;
}> = async (args, ctx) => {
  await ctx.assertFact({
    entity: args.entity,
    attribute: "room/name",
    value: args.name,
    positions: {},
  });
  await ctx.assertFact({
    entity: args.entity,
    attribute: "room/type",
    value: args.type,
    positions: {},
  });
  await ctx.runOnServer(async (id, env, userID) => {
    await app_event(env, {
      event: "created_room",
      spaceID: id,
      user: userID,
    });
  });
};

const deleteEntity: Mutation<{ entity: string }> = async (args, ctx) => {
  let references = await ctx.scanIndex.vae(args.entity);
  let facts = await ctx.scanIndex.eav(args.entity, null);
  await Promise.all(facts.concat(references).map((f) => ctx.retractFact(f.id)));
};

const addReaction: Mutation<{
  cardEntity: string;
  reactionFactID: string;
  reactionAuthorFactID: string;
  reaction: string;
  memberEntity: string;
}> = async (args, ctx) => {
  let reactions = await ctx.scanIndex.eav(args.cardEntity, "card/reaction");
  for (let reaction of reactions) {
    let author = await ctx.scanIndex.eav(reaction.id, "reaction/author");
    if (
      author?.value.value === args.memberEntity &&
      reaction.value === args.reaction
    )
      return;
  }
  await ctx.assertFact({
    entity: args.cardEntity,
    factID: args.reactionFactID,
    attribute: "card/reaction",
    value: args.reaction,
    positions: {},
  });
  await ctx.assertFact({
    entity: args.reactionFactID,
    factID: args.reactionAuthorFactID,
    attribute: "reaction/author",
    value: ref(args.memberEntity),
    positions: {},
  });
};

const markRead: Mutation<{
  entityID: string;
  memberEntity: string;
  attribute: "discussion/unread-by" | "card/unread-by";
}> = async (args, ctx) => {
  let unreads = await ctx.scanIndex.eav(args.entityID, args.attribute);
  let unread = unreads.find((u) => u.value.value === args.memberEntity);
  if (unread) await ctx.retractFact(unread.id);

  await ctx.runOnServer(async (id, env) => {
    let space = await ctx.scanIndex.eav(args.memberEntity, "space/member");
    if (!space) return;
    let supabase = createClient(env);
    let unreads = await calculateUnreads(args.memberEntity, ctx);
    await supabase
      .from("user_space_unreads")
      .upsert({ user: space.value, unreads, space: id });
  });
};

const initializeClient: Mutation<{
  clientID: string;
  memberEntity: string;
  clientEntity: string;
}> = async (args, ctx) => {
  let client = await ctx.scanIndex.ave("presence/client-id", args.clientID);
  if (client) return;
  await ctx.assertEmphemeralFact(args.clientID, {
    entity: args.clientEntity,
    attribute: "presence/client-id",
    value: args.clientID,
    positions: {},
  });
  await ctx.assertEmphemeralFact(args.clientID, {
    entity: args.clientEntity,
    attribute: "presence/client-member",
    value: ref(args.memberEntity),
    positions: {},
  });
};

const setClientInCall: Mutation<{
  clientID: string;
  clientEntity: string;
  inCall: boolean;
}> = async (args, ctx) => {
  if (args.inCall)
    await ctx.assertEmphemeralFact(args.clientID, {
      entity: args.clientEntity,
      attribute: "presence/in-call",
      value: true,
      positions: {},
    });
  else {
    let inCall = await ctx.scanIndex.eav(args.clientEntity, "presence/in-call");
    if (inCall) await ctx.retractEphemeralFact(args.clientID, inCall.id);
  }
};

const joinSpace: Mutation<{
  memberEntity: string;
  username: string;
  studio: string;
}> = async ({ memberEntity, username, studio }, ctx) => {
  let color = await getMemberColor(ctx);

  //TODO I should make this use the auth context to ensure that the user is
  //joining legitimately

  await Promise.all([
    ctx.assertFact({
      entity: memberEntity,
      attribute: "member/color",
      value: color,
      positions: {},
    }),
    ctx.assertFact({
      entity: memberEntity,
      attribute: "space/member",
      value: studio,
      positions: {},
    }),
    ctx.assertFact({
      entity: memberEntity,
      attribute: "member/name",
      value: username,
      positions: {},
    }),
  ]);
};

const leaveSpace: Mutation<{ memberEntity: string }> = async (
  { memberEntity },
  ctx
) => {
  //TODO use auth data to make sure users can only leave themselves
  let references = await ctx.scanIndex.vae(memberEntity);
  let facts = await ctx.scanIndex.eav(memberEntity, null);
  await Promise.all(facts.concat(references).map((f) => ctx.retractFact(f.id)));
};

const postToFeed: Mutation<{
  cardPosition?: { x: number; y: number };
  contentPosition?: { x: number; y: number };
  content: string;
  spaceID: string;
  cardEntity: string;
  memberStudioDO: string;
}> = async (msg, ctx) => {
  //TODO verify that the authed member is the one creating
  let entity = ulid();
  await ctx.assertFact({
    entity,
    attribute: "post/attached-card",
    value: { space_do_id: msg.spaceID, cardEntity: msg.cardEntity },
    positions: {},
  });

  await ctx.assertFact({
    entity,
    attribute: "card/content",
    value: msg.content,
    positions: {},
  });
  if (msg.contentPosition)
    await ctx.assertFact({
      entity,
      attribute: "post/content/position",
      positions: {},
      value: {
        type: "position",
        x: msg.contentPosition?.x || 0,
        y: msg.contentPosition?.y || 0,
        rotation: 0,
        size: "small",
      },
    });

  if (msg.contentPosition)
    await ctx.assertFact({
      entity,
      attribute: "post/attached-card/position",
      positions: {},
      value: {
        type: "position",
        x: msg.cardPosition?.x || 0,
        y: msg.cardPosition?.y || 0,
        rotation: 0,
        size: "small",
      },
    });

  let memberEntity = await ctx.scanIndex.ave(
    "space/member",
    msg.memberStudioDO
  );
  if (!memberEntity) return;
  await ctx.assertFact({
    entity,
    attribute: "card/created-by",
    value: ref(memberEntity?.entity),
    positions: {},
  });

  //getClientID somehow
  let latestPosts = await ctx.scanIndex.aev("feed/post");
  await ctx.assertFact({
    entity,
    attribute: "feed/post",
    value: generateKeyBetween(
      null,
      latestPosts.sort((a, b) => {
        let aPosition = a.value,
          bPosition = b.value;
        if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
        return aPosition > bPosition ? 1 : -1;
      })[0]?.value || null
    ),
    positions: {},
  });
};

const replaceCard: Mutation<{ currentCard: string; newCard: string }> = async (
  args,
  ctx
) => {
  let referenceFacts = await ctx.scanIndex.vae(args.currentCard);
  let facts = await ctx.scanIndex.eav(args.currentCard, null);
  await Promise.all([
    ...referenceFacts.map((f) =>
      ctx.updateFact(f.id, { value: ref(args.newCard) })
    ),
    ...facts.map((f) => ctx.retractFact(f.id)),
  ]);
};

export const Mutations = {
  replaceCard,
  markRead,
  deleteEntity,
  createCard,
  updatePositions,
  updateContentFact,
  updateTitleFact,
  addCardToSection,
  replyToDiscussion,
  assertFact,
  assertEmphemeralFact,
  retractFact,
  updateFact,
  postToFeed,
  updatePositionInDesktop,
  removeCardFromDesktopOrCollection,
  addCardToDesktop,
  addReaction,
  initializeClient,
  setClientInCall,
  joinSpace,
  leaveSpace,
  createRoom,
};
