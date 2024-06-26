import { Env } from "backend/SpaceDurableObject";
import { calculateUnreads, markUnread } from "src/markUnread";
import { Attribute, FilterAttributes, ReferenceAttributes } from "./Attributes";
import { Fact, ref } from "./Facts";
import { Message } from "./Messages";
import { z } from "zod";
import { webPushPayloadParser } from "pages/api/web_push";
import { sign } from "src/sign";
import { app_event } from "backend/lib/analytics";
import { getOrCreateMemberEntity } from "src/getOrCreateMemberEntity";
import { createClient } from "backend/lib/supabase";

export type MutationContext = {
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
    data: Partial<Fact<any>>,
    undoAction?: boolean
  ) => Promise<{ success: boolean }>;
  runOnServer: (
    fn: (env: Env, userID: string) => Promise<void>
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
  await ctx.runOnServer(async (env, userID) => {
    await app_event(env.env, {
      event: "created_card",
      space_do_id: env.id,
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

const retractEphemeralFact: Mutation<{ id: string; clientID: string }> = async (
  args,
  ctx
) => {
  await ctx.retractEphemeralFact(args.clientID, args.id);
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
  let existingLinks = await Promise.all(
    (
      await ctx.scanIndex.eav(args.entity, "card/inline-links-to")
    ).map(async (l) => ({
      id: l.id,
      title: await ctx.scanIndex.eav(l.value.value, "card/title"),
    }))
  );
  let newLinks = [...args.value.matchAll(/\[\[([^\[\n\]]*)\]\]/g)];

  let linkstoremove = existingLinks.filter(
    (l) => !newLinks.find((n) => n[1] === l.title?.value)
  );

  let linkstoadd = newLinks.filter(
    (n) => !existingLinks.find((l) => n[1] === l.title?.value)
  );

  for (let link of linkstoremove) {
    await ctx.retractFact(link.id);
  }
  for (let link of linkstoadd) {
    let title = link[1];
    let entity = await ctx.scanIndex.ave("card/title", title);
    if (!entity || entity.value !== title) continue;
    await ctx.assertFact({
      entity: args.entity,
      attribute: "card/inline-links-to",
      value: ref(entity.entity),
      positions: {},
    });
  }
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
  session: { username: string; studio: string };
  message: Omit<Message, "sender">;
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
  let sender = await getOrCreateMemberEntity(args.session, ctx);

  await markUnread(
    {
      entityID: args.discussion,
      memberEntity: sender,
      attribute: "discussion/unread-by",
    },
    ctx
  );

  await ctx.postMessage({ ...args.message, sender });
  let senderStudio = await ctx.scanIndex.eav(sender, "space/member");
  await ctx.runOnServer(async (env, userID) => {
    if (!senderStudio) return;

    let title: Fact<"room/name" | "card/title"> | null =
      await ctx.scanIndex.eav(args.discussion, "card/title");
    if (!title) title = await ctx.scanIndex.eav(args.discussion, "room/name");

    await app_event(env.env, {
      event: "sent_message",
      space_do_id: env.id,
      user: userID,
    });

    try {
      let payload: z.TypeOf<typeof webPushPayloadParser> = {
        type: "new-message",
        title: title?.value || "Untitled",
        senderStudio: senderStudio.value,
        message: args.message,
        spaceID: env.id,
      };
      let payloadString = JSON.stringify(payload);
      fetch(`${env.env.NEXT_API_URL}/api/web_push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: payloadString,
          sig: await sign(payloadString, env.env.RPC_SECRET),
        }),
      });
    } catch (e) {
      console.log(e);
    }
  });
};

const createRoom: Mutation<{
  entity: string;
  type: "canvas" | "collection" | "chat" | "card";
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
  await ctx.runOnServer(async (env, userID) => {
    await app_event(env.env, {
      event: "created_room",
      space_do_id: env.id,
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
  session: { username: string; studio: string };
}> = async (args, ctx) => {
  let reactions = await ctx.scanIndex.eav(args.cardEntity, "card/reaction");
  let memberEntity = await getOrCreateMemberEntity(args.session, ctx);
  for (let reaction of reactions) {
    let author = await ctx.scanIndex.eav(reaction.id, "reaction/author");
    if (
      author?.value.value === memberEntity &&
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
    value: ref(memberEntity),
    positions: {},
  });
};

const removeReaction: Mutation<{
  memberEntity: string;
  cardEntity: string;
  reaction: string;
}> = async (args, ctx) => {
  let allReactions = await ctx.scanIndex.eav(args.cardEntity, "card/reaction");
  let reactions = allReactions.filter((r) => r.value === args.reaction);
  for (let reaction of reactions) {
    let author = await ctx.scanIndex.eav(reaction.id, "reaction/author");
    if (author?.value.value === args.memberEntity) {
      await ctx.retractFact(author.id);
      await ctx.retractFact(reaction.id);
    }
  }
};

const markRead: Mutation<{
  entityID: string;
  space_id: string;
  memberEntity: string;
  userID: string;
  attribute: "discussion/unread-by" | "card/unread-by";
}> = async (args, ctx) => {
  let unreads = await ctx.scanIndex.eav(args.entityID, args.attribute);
  let unread = unreads.find((u) => u.value.value === args.memberEntity);
  if (unread) await ctx.retractFact(unread.id);

  await ctx.runOnServer(async (env) => {
    let supabase = createClient(env.env);
    let unreads = await calculateUnreads(args.memberEntity, ctx);
    await supabase.from("user_space_unreads").upsert({
      user: args.userID,
      space_id: args.space_id,
      unreads,
    });
  });
};

const initializeClient: Mutation<{
  clientID: string;
  memberEntity: string;
  clientEntity: string;
}> = async (args, ctx) => {
  let existingFact = await ctx.scanIndex.ave(
    "presence/client-id",
    args.clientID
  );
  if (existingFact && existingFact.entity !== args.clientEntity)
    ctx.retractEphemeralFact(args.clientID, existingFact.id);
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

export const checkCheckListItem: Mutation<{
  itemEntity: string;
  memberEntity: string;
  checked: boolean;
}> = async (args, ctx) => {
  let checkedBy = await ctx.scanIndex.eav(
    args.itemEntity,
    "checklist/item-completed-by"
  );
  let memberChecked = checkedBy.find(
    (c) => c.value.value === args.memberEntity
  );
  if (!!memberChecked === args.checked) return;
  if (args.checked)
    await ctx.assertFact({
      entity: args.itemEntity,
      attribute: "checklist/item-completed-by",
      value: ref(args.memberEntity),
      positions: {},
    });
  else if (memberChecked) {
    await ctx.retractFact(memberChecked.id);
  }
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
  retractEphemeralFact,
  updateFact,
  updatePositionInDesktop,
  removeCardFromDesktopOrCollection,
  addCardToDesktop,
  addReaction,
  removeReaction,
  initializeClient,
  setClientInCall,
  createRoom,
  checkCheckListItem,
};

export const StudioMatePermissions: Array<keyof typeof Mutations> = [
  "replyToDiscussion",
  "markRead",
  "addReaction",
  "removeReaction",
];
