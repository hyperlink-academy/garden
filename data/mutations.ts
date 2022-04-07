import { sortByPosition } from "components/DeckList";
import { generateKeyBetween } from "src/fractional-indexing";
import { Attribute } from "./Attributes";
import { Fact, FactMetadata } from "./Facts";

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
    for (let i = 0; i < positions.length; i++) {
      if (!positions[i].position) {
        let newPosition = generateKeyBetween(
          positions[i - 1]?.position || null,
          positions[i + 1]?.position || null
        );
        positions[i].position = newPosition;
        await context.updateFact(positions[i].id, {
          positions: { [args.positionKey]: newPosition },
        });
      }
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

export const Mutations = {
  moveCard,
  addSpace,
  addDeck,
  assertCardTitle,
};
