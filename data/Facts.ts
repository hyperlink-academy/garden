import { Attribute } from "data/Attributes";
type AttributeName = keyof Attribute;

export type FactMetadata = {
  id: string;
  retracted?: boolean;
  lastUpdated: string;
  schema: Schema;
  positions: { [k: string]: string | undefined };
};

export type Schema = {
  type: Fact<"type">["value"];
  unique: Fact<"unique">["value"];
  cardinality: Fact<"cardinality">["value"];
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
      number: number;
      boolean: boolean;
      file: {
        type: "file";
        id: string;
        filetype: "image";
      };
      reference: {
        type: "reference";
        value: string;
      };
      flag: {
        type: "flag";
      };
    }[Attribute[A]["type"]];

export const ref = (ref: string) => {
  return { type: "reference", value: ref } as const;
};

export const flag = () => {
  return { type: "flag" as const };
};

export const singleTextSection = (name: string) => {
  return `section/${name}` as "arbitrarySectionStringType";
};

export const multipleReferenceSection = (name: string) => {
  return `section/${name}` as "arbitrarySectionReferenceType";
};
