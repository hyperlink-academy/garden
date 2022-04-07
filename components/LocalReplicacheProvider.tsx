import { Attribute } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
import { CardinalityResult, MutationContext, Mutations } from "data/mutations";
import {
  FactWithIndexes,
  makeReplicache,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useEffect, useMemo, useRef, useState } from "react";
import { PullRequest, PushRequest } from "replicache";
import { ulid } from "src/ulid";

type Cookie = {
  lastUpdated: string;
};

export type Entity = {
  [k in keyof Attribute]?: Attribute[k] extends { cardinality: "many" }
    ? Fact<k>["value"][]
    : Fact<k>["value"];
};

export const LocalReplicacheProvider: React.FC<{
  defaultFacts: Entity[];
}> = (props) => {
  let db = useRef<{
    facts: Fact<keyof Attribute>[];
    lastMutationID: number;
    reset: boolean;
  }>({
    facts: [],
    lastMutationID: 0,
    reset: false,
  });
  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();
  let ctx = useMemo<MutationContext>(() => {
    const scanIndex: MutationContext["scanIndex"] = {
      ave: async (attribute, value) => {
        return db.current.facts.find(
          (f) => f.attribute === attribute && f.value === value
        ) as Fact<typeof attribute>;
      },
      eav: async (entity, attribute) => {
        let schema = Attribute[attribute];
        let facts = db.current.facts.filter(
          (f) => f.attribute === attribute && f.entity === entity
        );
        if (schema?.cardinality === "one")
          return facts[0] as CardinalityResult<typeof attribute>;
        return facts as CardinalityResult<typeof attribute>;
      },
    };

    const getSchema = async (attributeName: string) => {
      let attribute = await scanIndex.ave("name", attributeName);
      if (!attribute) return;

      let schema: Schema = {
        type:
          (await scanIndex.eav(attribute.entity, "type"))?.value || "string",
        unique:
          (await scanIndex.eav(attribute.entity, "unique"))?.value || false,
        cardinality:
          (await scanIndex.eav(attribute.entity, "cardinality"))?.value ||
          "one",
      };
      return schema;
    };
    return {
      scanIndex,
      retractFact: async (id) => {
        let factIndex = db.current.facts.findIndex((f) => f.id === id);
        if (factIndex !== -1) {
          db.current.facts[factIndex] = {
            ...db.current.facts[factIndex],
            retracted: true,
            lastUpdated: Date.now().toString(),
          };
        }
      },
      assertFact: async (fact) => {
        let newID = ulid();
        let lastUpdated = Date.now().toString();
        let schema: Schema | undefined = Attribute[fact.attribute];
        if (!schema) schema = await getSchema(fact.attribute);
        if (!schema) throw Error("no schema found for attribute");

        if (schema.cardinality) {
          let existingFactIndex = db.current.facts.findIndex(
            (f) => f.attribute === fact.attribute && f.entity === fact.entity
          );
          if (existingFactIndex !== -1) {
            db.current.facts[existingFactIndex] = {
              ...db.current.facts[existingFactIndex],
              ...fact,
              retracted: false,
              lastUpdated,
            };
            return { success: true };
          }
          db.current.facts.push({ ...fact, id: newID, lastUpdated, schema });
        }
        return { success: true };
      },
      updateFact: async (id, data) => {
        let existingFactIndex = db.current.facts.findIndex((f) => f.id === id);
        if (existingFactIndex === -1) return { success: false };
        db.current.facts[existingFactIndex] = {
          ...db.current.facts[existingFactIndex],
          ...data,
          lastUpdated: Date.now().toString(),
        };
        return { success: true };
      },
    };
  }, []);
  useEffect(() => {
    let rep = makeReplicache({
      name: "test-db",
      pusher: async (request) => {
        let data: PushRequest = await request.json();
        for (let i = 0; i < data.mutations.length; i++) {
          let m = data.mutations[i];
          let name = m.name as keyof typeof Mutations;
          if (m.id !== db.current.lastMutationID + 1) continue;
          await Mutations[name](m.args as any, ctx);
          db.current.lastMutationID = m.id;
        }
        return { httpStatusCode: 200, errorMessage: "" };
      },
      puller: async (request) => {
        let data: PullRequest = await request.json();
        let cookie = data.cookie as Cookie | undefined;
        let lastSeen = cookie?.lastUpdated || "0";
        let newFacts = db.current.facts.filter((f) => f.lastUpdated > lastSeen);
        let latestFact = newFacts.reduce(
          (acc, f) => (f.lastUpdated > acc ? f.lastUpdated : acc),
          newFacts[0]?.lastUpdated || "0"
        );
        let ops = newFacts.map((f) => {
          if (f.retracted)
            return {
              op: "del",
              key: f.id,
            } as const;
          return {
            op: "put",
            key: f.id,
            value: FactWithIndexes(f),
          } as const;
        });
        let reset = db.current.reset;
        if (reset) db.current.reset = false;
        return {
          httpRequestInfo: { httpStatusCode: 200, errorMessage: "" },
          response: {
            lastMutationID: data.lastMutationID,
            cookie: { lastUpdated: latestFact },
            patch: reset ? [{ op: "clear" }, ...ops] : ops,
          },
        };
      },
    });
    setRep(rep);
  }, []);
  useEffect(() => {
    let facts = props.defaultFacts.flatMap<Fact<keyof Attribute>>((e, id) => {
      return Object.keys(e).flatMap((a) => {
        let attribute: keyof Attribute = a as keyof Attribute;
        console.log(attribute);
        let schema = Attribute[attribute];
        if (!schema)
          throw Error("no schema found for attribute in default facts");
        if (schema.cardinality === "many")
          //@ts-ignore
          return e[attribute].map((v) => {
            console.log(v);
            return {
              schema,
              lastUpdated: Date.now().toString(),
              entity: id.toString(),
              id: ulid(),
              attribute: a as keyof Attribute,
              value: v,
              positions: {},
            };
          });
        return {
          schema,
          lastUpdated: Date.now().toString(),
          entity: id.toString(),
          id: ulid(),
          value: e[attribute],
          attribute: a as keyof Attribute,
          positions: {},
        };
      });
    });
    db.current.facts = facts;
    db.current.reset = true;
    if (rep) rep.pull();
  }, [props.defaultFacts, rep]);

  return (
    <ReplicacheContext.Provider value={rep ? { rep, id: "local" } : null}>
      {props.children}
    </ReplicacheContext.Provider>
  );
};
