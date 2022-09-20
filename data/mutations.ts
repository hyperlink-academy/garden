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
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions"> & {
      factID?: string;
    }
  ) => Promise<{ success: false } | { success: true; factID: string }>;
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

const addCardToDesktop: Mutation<{
  entity: string;
  desktop: string;
  position: { x: number; y: number; rotation: number; size: "big" | "small" };
}> = async (args, ctx) => {
  let id = await ctx.assertFact({
    entity: args.desktop,
    attribute: "deck/contains",
    value: ref(args.entity),
    positions: {},
  });
  if (!id.success) return;
  await ctx.assertFact({
    entity: id.factID,
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
  targetCardPositionFact: string;
  targetCardEntity: string;
  droppedCardPositionFact: string;
  droppedCardEntity: string;
  desktop: string;
}> = async (args, ctx) => {
  let isDeck = await ctx.scanIndex.eav(args.targetCardEntity, "deck");
  let children = await ctx.scanIndex.eav(args.desktop, "deck/contains");
  let deck = args.targetCardEntity;

  if (!isDeck) {
    let targetCardPosition = await ctx.scanIndex.eav(
      args.targetCardPositionFact,
      "card/position-in"
    );

    if (targetCardPosition) await ctx.retractFact(targetCardPosition.id);
    await ctx.retractFact(args.targetCardPositionFact);

    deck = ulid();
    await ctx.assertFact({
      entity: deck,
      attribute: "deck",
      positions: {},
      value: { type: "flag" },
    });
    let result = await ctx.assertFact({
      entity: args.desktop,
      attribute: "deck/contains",
      positions: {},
      value: ref(deck),
    });
    if (result.success) {
      console.log(targetCardPosition);
      await ctx.assertFact({
        entity: result.factID,
        attribute: "card/position-in",
        value: {
          type: "position",
          x: targetCardPosition?.value.x || 0,
          y: targetCardPosition?.value.y || 0,
          size: targetCardPosition?.value.size || "small",
          rotation: targetCardPosition?.value.rotation || 0,
        },
        positions: {},
      });
    }
    let newPosition = generateKeyBetween(null, null);
    await ctx.assertFact({
      entity: deck,
      attribute: "deck/contains",
      value: ref(args.targetCardEntity),
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
    value: ref(args.droppedCardEntity),
    positions: { eav: newPosition },
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

type FactInput = {
  [A in keyof Attribute]: Pick<
    Fact<A>,
    "attribute" | "entity" | "value" | "positions"
  >;
}[keyof Attribute];
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
  addCardToDesktop,
  addToOrCreateDeck,
};
