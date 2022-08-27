import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";
import { Attribute, ReferenceAttributes } from "./Attributes";
import { Fact, flag, ref } from "./Facts";
import { Message } from "./Messages";

export type MutationContext = {
  postMessage: (
    msg: Message,
    opts?: { ignoreBots: true }
  ) => Promise<{ success: boolean }>;
  assertFact: <A extends keyof Attribute>(
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions">
  ) => Promise<{ success: boolean }>;
  updateFact: (
    id: string,
    data: Partial<Fact<any>>
  ) => Promise<{ success: boolean }>;
  retractFact: (id: string) => Promise<void>;
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

const addDeck: Mutation<{
  name: string;
  newHomeEntity: string;
  newEntity: string;
  position: string;
}> = async (args, ctx) => {
  let homeFact = await ctx.scanIndex.aev("home");
  let homeEntity = homeFact[0]?.entity || args.newHomeEntity;

  let existingDecks = (
    await ctx.scanIndex.eav(homeEntity, "deck/contains")
  ).sort(sortByPosition("eav"));

  await Promise.all([
    !homeFact[0]
      ? ctx.assertFact({
          entity: homeEntity,
          attribute: "home",
          value: flag(),
          positions: {},
        })
      : undefined,
    ctx.assertFact({
      entity: homeEntity,
      attribute: "deck/contains",
      value: ref(args.newEntity),

      positions: {
        eav: generateKeyBetween(
          existingDecks[existingDecks.length]?.positions?.eav || null,
          null
        ),
      },
    }),
    ctx.assertFact({
      entity: args.newEntity,
      attribute: "deck",
      value: { type: "flag" },
      positions: { aev: args.position },
    }),
    !args.name
      ? undefined
      : ctx.assertFact({
          entity: args.newEntity,
          attribute: "card/title",
          value: args.name,
          positions: {},
        }),
  ]);
};

const addSpace: Mutation<{
  name: string;
  studio: string;
  spaceID: string;
  entityID: string;
}> = async (args, ctx) => {
  await Promise.all([
    ctx.assertFact({
      entity: args.entityID,
      attribute: "space/name",
      value: args.name,
      positions: {},
    }),
    ctx.assertFact({
      entity: args.entityID,
      attribute: "space/studio",
      value: args.studio,
      positions: {},
    }),
    ctx.assertFact({
      entity: args.entityID,
      attribute: "space/id",
      value: args.spaceID,
      positions: {},
    }),
    ctx.assertFact({
      entity: args.entityID,
      attribute: "space/external",
      value: true,
      positions: {},
    }),
  ]);
};
const updatePositionInDesktop: Mutation<{
  entityID: string;
  parent: string;
  dx: number;
  dy: number;
}> = async (args, ctx) => {
  let allPositionFacts = await ctx.scanIndex.eav(
    args.entityID,
    "card/position-in"
  );
  let positionFact = allPositionFacts.find(
    (f) => f.value.value === args.parent
  );
  if (!positionFact) {
    await ctx.assertFact({
      entity: args.entityID,
      value: ref(args.parent),
      attribute: "card/position-in",
      positions: { x: args.dx.toString(), y: args.dy.toString() },
    });
  } else {
    let x = parseInt(positionFact.positions.x || "0");
    let y = parseInt(positionFact.positions.y || "0");
    await ctx.updateFact(positionFact.id, {
      positions: { x: (x + args.dx).toString(), y: (y + args.dy).toString() },
    });
  }
};
const addToOrCreateDeck: Mutation<{
  parent: string;
  child: string;
  desktop: string;
}> = async (args, ctx) => {
  let isDeck = await ctx.scanIndex.eav(args.parent, "deck");
  let children = await ctx.scanIndex.eav(args.desktop, "deck/contains");
  let deck = args.parent;

  if (!isDeck) {
    let allPositionFacts = await ctx.scanIndex.eav(
      args.parent,
      "card/position-in"
    );
    let parentPosition = allPositionFacts.find(
      (f) => f.value.value === args.desktop
    );
    let parentInDesktop = children.find((f) => f.value.value === args.parent);

    console.log(parentInDesktop, parentPosition);
    if (parentPosition) await ctx.retractFact(parentPosition.id);
    if (parentInDesktop) await ctx.retractFact(parentInDesktop.id);

    let deck = ulid();
    await ctx.assertFact({
      entity: deck,
      attribute: "deck",
      positions: {},
      value: { type: "flag" },
    });
    await ctx.assertFact({
      entity: args.desktop,
      attribute: "deck/contains",
      positions: {},
      value: ref(deck),
    });
    await ctx.assertFact({
      entity: deck,
      attribute: "card/position-in",
      positions: {
        x: parentPosition?.positions.x || "0",
        y: parentPosition?.positions.y || "0",
      },
      value: ref(args.desktop),
    });
    let newPosition = generateKeyBetween(null, null);
    await ctx.assertFact({
      entity: deck,
      attribute: "deck/contains",
      value: ref(args.parent),
      positions: { eav: newPosition },
    });
  }

  let existingCards = await ctx.scanIndex.eav(deck, "deck/contains");
  let lastChild = existingCards.sort(sortByPosition("eav"))[
    existingCards.length - 1
  ];
  let newPosition = generateKeyBetween(lastChild?.positions.eav || null, null);
  await ctx.assertFact({
    entity: deck,
    attribute: "deck/contains",
    value: ref(args.child),
    positions: { eav: newPosition },
  });

  let allPositionFacts = await ctx.scanIndex.eav(
    args.child,
    "card/position-in"
  );
  let positionFact = allPositionFacts.find(
    (f) => f.value.value === args.desktop
  );
  let childInDesktop = children.find((f) => f.value.value === args.child);
  if (positionFact) await ctx.retractFact(positionFact?.id);
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

const createCard: Mutation<{ entityID: string; title: string }> = async (
  args,
  ctx
) => {
  await ctx.assertFact({
    entity: args.entityID,
    attribute: "card/title",
    value: args.title,
    positions: {},
  });
};

type FactInput = Pick<
  Fact<keyof Attribute>,
  "attribute" | "entity" | "value" | "positions"
>;
const assertFact: Mutation<FactInput | FactInput[]> = async (args, ctx) => {
  await Promise.all(
    [args].flat().map((f) => {
      return ctx.assertFact({ ...f });
    })
  );
};

const retractFact: Mutation<{ id: string }> = async (args, ctx) => {
  await ctx.retractFact(args.id);
};

const postMessage: Mutation<Message> = async (args, ctx) => {
  await ctx.postMessage(args);
};

const addSection: Mutation<{
  newSectionEntity: string;
  sectionName: string;
  type: "string" | "reference";
  positions: string;
  cardEntity: string;
}> = async (args, ctx) => {
  if (!args.sectionName) return;
  let sectionEntity = (
    await ctx.scanIndex.ave("name", `section/${args.sectionName}`)
  )?.entity;
  if (!sectionEntity) {
    sectionEntity = args.newSectionEntity;
    await ctx.assertFact({
      entity: args.newSectionEntity,
      attribute: "name",
      value: `section/${args.sectionName}`,
      positions: {},
    });
    await ctx.assertFact({
      entity: args.newSectionEntity,
      attribute: "type",
      value: args.type,
      positions: {},
    });

    await ctx.assertFact({
      entity: args.newSectionEntity,
      attribute: "cardinality",
      value: args.type === "reference" ? "many" : "one",
      positions: {},
    });
  }
  let existingSections = await ctx.scanIndex.eav(
    args.cardEntity,
    "card/section"
  );
  if (existingSections.find((s) => s.value === args.sectionName)) return;

  let type = await ctx.scanIndex.eav(sectionEntity, "type");
  let cardinality = await ctx.scanIndex.eav(sectionEntity, "cardinality");
  if (!type || !cardinality) return;
  if (type.value !== args.type) return;

  await ctx.assertFact({
    entity: args.cardEntity,
    attribute: "card/section",
    value: args.sectionName,
    positions: { eav: args.positions },
  });
};

const updateLastSeenMessage: Mutation<{
  space: string;
  lastSeenMessage: number;
}> = async (args, ctx) => {
  let space = await ctx.scanIndex.ave("space/id", args.space);
  if (!space) return;
  let lastSeenMessage = await ctx.scanIndex.eav(
    space.entity,
    "space/lastSeenMessage"
  );
  if ((lastSeenMessage?.value || 0) > args.lastSeenMessage) return;
  await ctx.assertFact({
    entity: space.entity,
    value: args.lastSeenMessage,
    attribute: "space/lastSeenMessage",
    positions: {},
  });
};

const deleteEntity: Mutation<{ entity: string }> = async (args, ctx) => {
  let references = await ctx.scanIndex.vae(args.entity);
  let facts = await ctx.scanIndex.eav(args.entity, null);
  console.log("deleting?");
  await Promise.all(facts.concat(references).map((f) => ctx.retractFact(f.id)));
};

export const Mutations = {
  updateLastSeenMessage,
  deleteEntity,
  postMessage,
  createCard,
  addSpace,
  updatePositions,
  addDeck,
  addCardToSection,
  assertFact,
  retractFact,
  addSection,
  updatePositionInDesktop,
  addToOrCreateDeck,
};
