import { Attribute } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
import {
  FactWithIndexes,
  makeReplicache,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { ulid } from "src/ulid";

export type Entity = {
  [k in keyof Attribute]?: Attribute[k] extends { cardinality: "many" }
    ? Fact<k>["value"][]
    : Fact<k>["value"];
};

export const LocalReplicacheProvider: React.FC<React.PropsWithChildren<{
  defaultAttributes: { [k: string]: Schema };
  defaultFacts: Entity[];
}>> = (props) => {
  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();
  useEffect(() => {
    let rep = makeReplicache({
      name: "test-db",
      pusher: async () => {
        return { httpStatusCode: 200, errorMessage: "" };
      },
      puller: async (_request) => {
        let memberFactID = ulid();
        let ops = props.defaultFacts
          .flatMap((e, entity) => {
            return Object.keys(e).flatMap((a) => {
              let attribute: keyof Attribute = a as keyof Attribute;
              let value = e[attribute];
              let schema: Schema = Attribute[attribute];
              if (!schema) schema = props.defaultAttributes[attribute];
              if (schema?.cardinality === "many")
                return (value as Fact<any>["value"][]).map((v) => {
                  let id = ulid();
                  return {
                    op: "put",
                    key: id,
                    value: FactWithIndexes({
                      schema,
                      lastUpdated: Date.now().toString(),
                      entity: entity.toString(),
                      id,
                      attribute: a as keyof Attribute,
                      value: v,
                      positions: {},
                    }),
                  } as const;
                });
              let id = ulid();
              return {
                op: "put",
                key: id,
                value: FactWithIndexes({
                  schema,
                  lastUpdated: Date.now().toString(),
                  entity: entity.toString(),
                  id,
                  value: e[attribute] as Fact<any>["value"],
                  attribute: a as keyof Attribute,
                  positions: {},
                }),
              } as const;
            });
          })
          .concat([
            {
              op: "put",
              key: memberFactID,
              value: FactWithIndexes({
                schema: Attribute["space/member"],
                lastUpdated: Date.now().toString(),
                attribute: "space/member",
                value: "authorized-studio",
                positions: {},
                id: memberFactID,
                entity: ulid(),
              }),
            },
          ]);
        return {
          httpRequestInfo: { httpStatusCode: 200, errorMessage: "" },
          response: {
            lastMutationID: 0,
            patch: [{ op: "clear" }, ...ops],
          },
        };
      },
    });
    setRep(rep);
    return () => {
      rep?.close();
    };
  }, [props.defaultFacts, props.defaultAttributes]);

  return (
    <ReplicacheContext.Provider value={rep ? { rep, id: "local" } : null}>
      {props.children}
    </ReplicacheContext.Provider>
  );
};
