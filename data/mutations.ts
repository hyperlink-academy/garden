import { Attribute } from "./Attributes";
import { Fact } from "./Facts";

type Context = {
  assertFact: <A extends keyof Attribute>(
    d: Pick<Fact<A>, "entity" | "attribute" | "value" | "positions">
  ) => Promise<void>;
  updateFact: <A extends keyof Attribute>(
    id: string,
    data: Partial<Fact<A>>
  ) => void;
  scanIndex: {
    eav: <A extends keyof Attribute>(entity: string, attribute: A) => Fact<A>[];
    ave: <A extends keyof Attribute>(attribute: A, value: string) => Fact<A>;
  };
};

type Mutation<T> = (args: T, ctx: Context) => Promise<void>;

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
