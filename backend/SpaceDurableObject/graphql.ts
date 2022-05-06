import { createServer } from "@graphql-yoga/common";
import { Attribute, ReferenceAttributes } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
import { CardinalityResult } from "data/mutations";
import { Env } from ".";
export async function graphqlServer(request: Request, ctx: Env) {
  let sections = await Promise.all(
    [
      ...(
        await ctx.storage.list<Fact<"name">>({ prefix: "av-name-section/" })
      ).values(),
    ].map(async (s) => {
      let schema = await ctx.factStore.getSchema(s.value);
      return { name: s.value, schema };
    })
  );

  const server = createServer({
    schema: {
      typeDefs: `
        type Entity {
          id: String!
          ${Object.keys(Attribute)
            .map((a) => {
              let attribute = Attribute[a as keyof Attribute];
              let type = attribute.type === "reference" ? "Entity" : "String";
              return `${slugify(a)}: ${
                attribute.cardinality === "many" ? `[${type}!]!` : type
              }`;
            })
            .join("\n")}

            ${sections
              .map((s) => {
                let type = s.schema?.type === "reference" ? "Entity" : "String";
                return `${slugify(s.name)}: ${
                  s.schema?.cardinality === "many" ? `[${type}!]!` : type
                }`;
              })
              .join("\n")}
        }

        type Query {
          entity(id:String ):Entity 
          name(name:String):Entity
        }`,
      resolvers: {
        Query: {
          name: async (_parent: unknown, args: { name: string }) => {
            let entity = await ctx.factStore.scanIndex.ave(
              "card/title",
              args.name
            );
            if (entity) return { id: entity.entity };
            return;
          },
          entity: async (_parent: unknown, args: { id: string }) => {
            return {
              id: args.id,
            };
          },
        },
        Entity: {
          id: (parent: { id: string }) => parent.id,
          ...Object.keys(Attribute).reduce((acc, a) => {
            acc[slugify(a)] = async (parent: { id: string }) => {
              let attributeName: keyof Attribute = a as keyof Attribute;
              let attribute = Attribute[attributeName];
              let facts = await ctx.factStore.scanIndex.eav(
                parent.id,
                attributeName
              );

              if (attribute?.type === "reference") {
                if (attribute?.cardinality === "many") {
                  let data: Fact<keyof ReferenceAttributes>[] = facts as Fact<
                    keyof ReferenceAttributes
                  >[];
                  return data.map((f) => ({ id: f.value.value }));
                }
                let data = facts as CardinalityResult<any> as Fact<
                  keyof ReferenceAttributes
                >;
                return { id: data.value.value };
              }
              if (attribute?.cardinality === "many") {
                return facts.map((f) => f.value);
              }
              let data = facts as CardinalityResult<any> as Fact<any>;
              return data.value;
            };
            return acc;
          }, {} as { [k: string]: (p: { id: string }) => any }),
          ...sections.reduce((acc, s) => {
            acc[slugify(s.name)] = async (parent: { id: string }) => {
              let attributeName = s.name;
              let attribute = s.schema;
              let facts = await ctx.factStore.scanIndex.eav(
                parent.id,
                attributeName as keyof Attribute
              );
              if (attribute?.type === "reference") {
                if (attribute?.cardinality === "many") {
                  let data: Fact<keyof ReferenceAttributes>[] = facts as Fact<
                    keyof ReferenceAttributes
                  >[];
                  return data.map((f) => ({ id: f.value.value }));
                }
                let data = facts as CardinalityResult<any> as Fact<
                  keyof ReferenceAttributes
                >;
                return { id: data.value.value };
              }
              if (attribute?.cardinality === "many") {
                return facts.map((f) => f.value);
              }
              let data = facts as CardinalityResult<any> as Fact<any>;
              return data.value;
            };

            return acc;
          }, {} as { [k: string]: (p: { id: string }) => any }),
        },
      },
    },
  });
  return server.handleRequest(request);
}

export const slugify = (str: string) => {
  var specials =
    /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~’]/g;
  return str.trim().replace(specials, "").replace(/\s/g, "_").toLowerCase();
};
