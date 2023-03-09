import { privateSpaceAPI } from "backend/lib/api";
import { Env } from "backend/SpaceDurableObject";
import { generateKeyBetween } from "src/fractional-indexing";
import { calculateUnreads, markUnread } from "src/markUnread";
import { sortByPosition } from "src/position_helpers";
import { Attribute, ReferenceAttributes } from "./Attributes";
import { Fact, ref } from "./Facts";
import { Message } from "./Messages";

export type MutationContext = {
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
  runOnServer: (fn: (env: Env) => Promise<void>) => Promise<void>;
  retractFact: (id: string, undoAction?: boolean) => Promise<void>;
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
export type CardinalityResult<A extends keyof Attribute | null> = null extends A
  ? Fact<keyof Attribute>[]
  : Attribute[OptionalAttribute<A>] extends {
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

const addToOrCreateDeck: Mutation<{
  targetCardEntity: string;
  droppedCardPositionFact: string;
  droppedCardEntity: string;
  desktop: string;
  factID: string;
}> = async (args, ctx) => {
  // This now just adds a reference to a card since all cards are kinda decks
  let children = await ctx.scanIndex.eav(args.desktop, "deck/contains");
  let deck = args.targetCardEntity;

  let existingCards = await ctx.scanIndex.eav(deck, "deck/contains");
  let lastChild = existingCards.sort(sortByPosition("eav"))[
    existingCards.length - 1
  ];
  let newPosition = generateKeyBetween(lastChild?.positions.eav || null, null);
  await ctx.assertFact({
    entity: deck,
    attribute: "deck/contains",
    value: ref(args.droppedCardEntity),
    positions: { eav: newPosition },
    factID: args.factID,
  });

  let childInDesktop = children.find(
    (f) => f.value.value === args.droppedCardEntity
  );
  await ctx.retractFact(args.droppedCardPositionFact);
  if (childInDesktop) await ctx.retractFact(childInDesktop?.id);
  return;
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
  cardEntity: string;
  parent: string;
  section: string;
  positions: { [k: string]: string };
}> = async (args, ctx) => {
  let existingCards = await ctx.scanIndex.eav(
    args.parent,
    args.section as "arbitrarySectionReferenceType"
  );
  let existing = existingCards.find((f) => f.value.value === args.cardEntity);
  if (existing && !existing.retracted) return;
  await ctx.assertFact({
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

const createDiscussion: Mutation<{
  cardEntity: string;
  discussionEntity: string;
  content: string;
  date: string;
  memberEntity: string;
}> = async (args, ctx) => {
  await ctx.assertFact({
    entity: args.cardEntity,
    attribute: "card/discussion",
    value: ref(args.discussionEntity),
    positions: {},
  });
  await ctx.assertFact({
    entity: args.discussionEntity,
    attribute: "discussion/content",
    value: args.content,
    positions: {},
  });
  await ctx.assertFact({
    entity: args.discussionEntity,
    attribute: "discussion/created-at",
    value: {
      type: "iso_string",
      value: args.date,
    },
    positions: {},
  });
  await ctx.assertFact({
    entity: args.discussionEntity,
    attribute: "discussion/author",
    value: ref(args.memberEntity),
    positions: {},
  });
  await markUnread(
    {
      entityID: args.discussionEntity,
      memberEntity: args.memberEntity,
      attribute: "discussion/unread-by",
    },
    ctx
  );
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
};

const deleteEntity: Mutation<{ entity: string }> = async (args, ctx) => {
  let references = await ctx.scanIndex.vae(args.entity);
  let facts = await ctx.scanIndex.eav(args.entity, null);
  console.log("deleting?");
  await Promise.all(facts.concat(references).map((f) => ctx.retractFact(f.id)));
};

const drawAPrompt: Mutation<{
  desktopEntity: string;
  factID: string;
  prompts: Fact<"desktop/contains">[];
  randomSeed: number;
}> = async (args, ctx) => {
  let prompt = args.prompts[Math.floor(args.prompts.length * args.randomSeed)];

  if (!prompt) return;
  let id = await ctx.assertFact({
    factID: args.factID,
    entity: args.desktopEntity,
    attribute: "desktop/contains",
    value: ref(prompt.value.value),
    positions: {},
  });
  if (!id.success) return;
  await ctx.assertFact({
    entity: args.factID,
    attribute: "card/position-in",
    value: {
      type: "position",
      y: 64,
      x: 128,
      size: "small",
      rotation: ((args.randomSeed * 10000) % 60) / 100 - 0.3,
    },
    positions: {},
  });
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
    let author = await ctx.scanIndex.eav(reaction.entity, "reaction/author");
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

  await ctx.runOnServer(async (env) => {
    let space = await ctx.scanIndex.eav(args.memberEntity, "space/member");
    if (!space) return;
    let spaceID = env.env.SPACES.idFromString(space.value);
    let unreads = await calculateUnreads(args.memberEntity, ctx);
    let stub = env.env.SPACES.get(spaceID);
    await privateSpaceAPI(stub)("http://internal", "sync_notifications", {
      space: env.id,
      unreads,
    });
  });
};

export const Mutations = {
  markRead,
  deleteEntity,
  createCard,
  updatePositions,
  addCardToSection,
  drawAPrompt,
  createDiscussion,
  replyToDiscussion,
  assertFact,
  retractFact,
  updateFact,
  updatePositionInDesktop,
  addCardToDesktop,
  addToOrCreateDeck,
  addReaction,
};
