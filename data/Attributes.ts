export const BaseAttributes = {
  name: {
    unique: true,
    cardinality: "one",
    type: "string",
  },
  unique: {
    cardinality: "one",
    unique: false,
    type: "boolean",
  },
  type: {
    type: "union",
    unique: false,
    cardinality: "one",
    "union/value": ["string", "union", "reference", "boolean", "flag"],
  },
  "union/value": {
    unique: false,
    type: "string",
    cardinality: "many",
  },
  cardinality: {
    unique: false,
    type: "union",
    cardinality: "one",
    "union/value": ["many", "one"],
  },
} as const;

export const DefaultAttributes = {
  arbitrarySectionReferenceType: {
    type: "reference",
    unique: false,
    cardinality: "many",
  },
  arbitrarySectionStringType: {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  section: {
    type: "string",
    unique: false,
    cardinality: "many",
  },
  title: {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  contains: {
    type: "reference",
    unique: false,
    cardinality: "many",
  },
  deck: {
    type: "flag",
    unique: false,
    cardinality: "one",
  },
  author: {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  notes: {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  quotes: {
    type: "reference",
    unique: false,
    cardinality: "many",
  },
  textContent: {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  "card/title": {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  ["activity/studio"]: {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  ["activity/id"]: {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  ["activity/external"]: {
    type: "boolean",
    unique: false,
    cardinality: "one",
  },
  "activity/member": {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  "activity/name": {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  "member/name": {
    unique: true,
    type: "string",
    cardinality: "one",
  },
  "this/name": {
    unique: true,
    type: "string",
    cardinality: "one",
  },
} as const;

export const Attribute = { ...DefaultAttributes, ...BaseAttributes };
export type Attribute = typeof Attribute;
