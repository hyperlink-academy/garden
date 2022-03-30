import { Expr } from "faunadb";

type Term = { field: string[] };
type Value = { field: string[] };
export type IndexDefinition = {
  name: string;
  source: Expr;
  terms: Term[];
  values: Value[];
  unique?: boolean;
  serialized?: boolean;
};

type Privilege = {
  resource: Expr;
  actions: {
    create?: boolean;
    delete?: boolean;
    write?: boolean;
    call?: boolean;
  };
};

export type RoleDefinition = {
  name: string;
  privileges: Privilege[];
};

export type FunctionDefinition = {
  role?: "server";
  name: string;
  body: Expr;
};
