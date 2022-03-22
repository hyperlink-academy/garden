import { Attribute } from "data/Attributes";

type Attribute = typeof Attribute;
type AttributeName = keyof Attribute;

type FactMetadata = {
  id: string;
  retracted?: boolean;
  lastUpdated: string;
  positions: { [k: string]: string | undefined };
};

export type Fact<A extends AttributeName> = FactMetadata & {
  attribute: A;
  entity: string;
  value: Value<A>;
};

type Value<A extends AttributeName> = Attribute[A] extends {
  type: "union";
}
  ? Attribute[A]["union/value"][number]
  : {
      union: never;
      string: string;
      boolean: boolean;
      reference: {
        type: "reference";
        value: string;
      };
      flag: {
        type: "flag";
      };
    }[Attribute[A]["type"]];
