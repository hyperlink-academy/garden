import { Attribute } from "./Attributes";
import { Fact, FactMetadata } from "./Facts";

export type MutationContext = {
  assertFact: <A extends keyof Attribute>(
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions">
  ) => Promise<void>;
  updateFact: (id: string, data: Partial<FactMetadata>) => Promise<void>;
  retractFact: (id: string) => Promise<void>;
  scanIndex: {
    eav: <A extends keyof Attribute>(
      entity: string,
      attribute: A
    ) => Promise<CardinalityResult<A>>;
    ave: <A extends keyof Attribute>(
      attribute: A,
      value: string
    ) => Promise<Fact<A> | undefined>;
  };
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

export const Mutations = {
  addDeck,
};
