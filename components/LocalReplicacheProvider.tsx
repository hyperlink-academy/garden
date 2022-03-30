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
  id: string;
  facts: Pick<Fact<keyof Attribute>, "attribute" | "value">[];
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
        let cardinality = "many";
        let schema = Attribute[attribute];
        if (!schema) {
          let attrEntity = db.current.facts.find(
            (f) => f.attribute === "name" && f.value === attribute
          );
          if (!attrEntity) throw new Error("no attribute found!");
          cardinality =
            (db.current.facts.find(
              (f) =>
                f.entity === attrEntity?.entity && f.attribute === "cardinality"
            )?.value as "one" | "many") || "one";
        }
        let facts = db.current.facts.filter(
          (f) => f.attribute === attribute && f.entity === entity
        );
        if (cardinality === "one")
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
            return;
          }
          db.current.facts.push({ ...fact, id: newID, lastUpdated, schema });
        }
      },
      updateFact: async (id, data) => {
        let existingFactIndex = db.current.facts.findIndex((f) => f.id === id);
        if (existingFactIndex === -1) return;
        db.current.facts[existingFactIndex] = {
          ...db.current.facts[existingFactIndex],
          ...data,
          lastUpdated: Date.now().toString(),
        };
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
    let facts = props.defaultFacts.flatMap<Fact<keyof Attribute>>((e) => {
      return e.facts.map((f) => {
        let schema = Attribute[f.attribute];
        if (!schema)
          throw Error("no schema found for attribute in default facts");
        return {
          schema,
          lastUpdated: Date.now().toString(),
          entity: e.id,
          id: ulid(),
          ...f,
          positions: {},
        };
      });
    });
    db.current.facts = facts;
    db.current.reset = true;
    if (rep) rep.pull();
  }, [props.defaultFacts, rep]);

  return (
    <ReplicacheContext.Provider value={rep ? { rep } : null}>
      {props.children}
    </ReplicacheContext.Provider>
  );
};
