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
    "union/value": [
      "string",
      "union",
      "reference",
      "boolean",
      "flag",
      "number",
    ],
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
  "deck/contains": {
    type: "reference",
    unique: false,
    cardinality: "many",
  },
  deck: {
    type: "flag",
    unique: false,
    cardinality: "one",
  },
  "card/content": {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  "card/section": {
    type: "string",
    unique: false,
    cardinality: "many",
  },
  "card/title": {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  ["space/studio"]: {
    type: "string",
    unique: false,
    cardinality: "one",
  },
  ["space/id"]: {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  ["space/external"]: {
    type: "boolean",
    unique: false,
    cardinality: "one",
  },
  "space/member": {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  "space/name": {
    type: "string",
    unique: true,
    cardinality: "one",
  },
  "space/lastSeenMessage": {
    type: "number",
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
  "this/description": {
    unique: false,
    type: "string",
    cardinality: "one",
  },
} as const;

export const Attribute = { ...DefaultAttributes, ...BaseAttributes };
export type Attribute = typeof Attribute;
export type UniqueAttributes = {
  [A in keyof Attribute as Attribute[A]["unique"] extends true
    ? A
    : never]: Attribute[A];
};

export type ReferenceAttributes = {
  [A in keyof Attribute as Attribute[A]["type"] extends "reference"
    ? A
    : never]: Attribute[A];
};
