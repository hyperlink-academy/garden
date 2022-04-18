import { sortByPosition } from "src/position_helpers";
import {
  generateKeyBetween,
  generateNKeysBetween,
} from "src/fractional-indexing";
import { Attribute } from "./Attributes";
import {
  Fact,
  FactMetadata,
  multipleReferenceSection,
  ref,
  singleTextSection,
} from "./Facts";

export type MutationContext = {
  assertFact: <A extends keyof Attribute>(
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions">
  ) => Promise<{ success: boolean }>;
  updateFact: (
    id: string,
    data: Partial<FactMetadata>
  ) => Promise<{ success: boolean }>;
  retractFact: (id: string) => Promise<void>;
  scanIndex: {
    eav: <A extends keyof Attribute>(
      entity: string,
      attribute: A
    ) => Promise<CardinalityResult<A>>;
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

export type CardinalityResult<A extends keyof Attribute> =
  Attribute[A] extends {
    cardinality: "one";
  }
    ? Fact<A> | null
    : Fact<A>[];

type Mutation<T> = (args: T, ctx: MutationContext) => Promise<void>;

const addDeck: Mutation<{
  name: string;
  newEntity: string;
  position: string;
}> = async (args, ctx) => {
  await Promise.all([
    ctx.assertFact({
      entity: args.newEntity,
      attribute: "deck",
      value: { type: "flag" },
      positions: { aev: args.position },
    }),
    ctx.assertFact({
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

const moveCard: Mutation<{
  factID: string;
  positionKey: string;
  parent: string;
  index: number;
  attribute: keyof Attribute;
}> = async (args, context) => {
  let children = await context.scanIndex.eav(args.parent, args.attribute);
  let hasUnpositionedChildren = children.reduce(
    (acc, child) => acc || !child.positions[args.positionKey],
    false
  );
  let positions = children.sort(sortByPosition(args.positionKey)).map((f) => {
    return {
      id: f.id,
      position: f.positions[args.positionKey],
    };
  });
  if (hasUnpositionedChildren) {
    let newPositions = generateNKeysBetween(null, null, positions.length);
    for (let i = 0; i < positions.length; i++) {
      positions[i].position = newPositions[i];
      await context.updateFact(positions[i].id, {
        positions: { [args.positionKey]: newPositions[i] },
      });
    }
  }
  let newPosition = generateKeyBetween(
    positions[args.index]?.position || null,
    positions[args.index + 1]?.position || null
  );
  await context.updateFact(args.factID, {
    positions: { [args.positionKey]: newPosition },
  });
};

const assertCardTitle: Mutation<{ cardEntity: string; title: string }> = async (
  args,
  ctx
) => {
  await ctx.assertFact({
    entity: args.cardEntity,
    attribute: "card/title",
    value: args.title,
    positions: {},
  });
  return;
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
  if (!!existingCards.find((f) => f.value.value === args.cardEntity)) return;
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

const assertFact: Mutation<
  Pick<Fact<keyof Attribute>, "attribute" | "entity" | "value" | "positions">
> = async (args, ctx) => {
  await ctx.assertFact({ ...args });
};

const retractFact: Mutation<{ id: string }> = async (args, ctx) => {
  await ctx.retractFact(args.id);
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

export const Mutations = {
  createCard,
  moveCard,
  addSpace,
  addDeck,
  addCardToSection,
  assertCardTitle,
  assertFact,
  retractFact,
  addSection,
};
