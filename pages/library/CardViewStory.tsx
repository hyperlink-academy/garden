import { CardView } from "components/CardView";
import {
  flag,
  multipleReferenceSection,
  ref,
  singleTextSection,
} from "data/Facts";
import { title } from "src/lorem";
import { ComponentViewer, Props, Stories } from "./index";
export { getStaticProps } from "./index";

const BaseEntities = [
  ...[...Array(4).keys()].map(() => {
    return {
      "card/title": title(),
    };
  }),
  {
    "card/title": "A deck!",
    deck: flag(),
    "deck/contains": [ref("0")],
  },
  {
    "card/title": "A another card",
    [multipleReferenceSection("Related")]: [ref("0")],
  },
  {
    name: multipleReferenceSection("Quotes"),
    cardinality: "many",
    type: "reference",
  },
  {
    name: multipleReferenceSection("Ideas"),
    cardinality: "many",
    type: "reference",
  },
  {
    name: multipleReferenceSection("Related"),
    cardinality: "many",
    type: "reference",
  },
  {
    name: singleTextSection("Notes"),
    cardinality: "one",
    type: "string",
  },
  {
    name: singleTextSection("Text Section"),
    cardinality: "one",
    type: "string",
  },
] as const;

let attributes = {
  [singleTextSection("Text Section")]: {
    type: "string",
    cardinality: "one",
    unique: false,
  },
  [multipleReferenceSection("Quotes")]: {
    type: "reference",
    cardinality: "many",
    unique: false,
  },
  [multipleReferenceSection("Related")]: {
    unique: false,
    cardinality: "many",
    type: "reference",
  },
} as const;
const Stories: Stories = {
  empty: { entities: [] },
  default: {
    attributes,
    entities: [
      {
        "card/content": "hi I am descripshun",
        "card/title": "Hello Card",
        "card/section": ["Text Section", "Quotes"],
        [singleTextSection(
          "Text Section"
        )]: `Hello, I am here again with more text and I just keep on coming with those bangers. Is there an award I can get for best copy text? The Blabies?`,
        [multipleReferenceSection("Quotes")]: [ref("1"), ref("2"), ref("3")],
      },
      ...BaseEntities,
    ],
  },
  DeckCard: {
    attributes,
    entities: [
      {
        "card/content": "Hi I am a deck card",
        "card/title": "Hello Deck",
        deck: flag(),
        "card/section": ["Text Section"],
        [singleTextSection(
          "Text Section"
        )]: `Hello, I am here again with more text and I just keep on coming with those bangers. Is there an award I can get for best copy text? The Blabies?`,
        ["deck/contains"]: [ref("1"), ref("2"), ref("3")],
      },
      ...BaseEntities,
    ],
  },
};

const CardViewStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={Stories}>
      <CardView entityID={"0"} />
    </ComponentViewer>
  );
};

CardViewStory.metadata = {
  name: "Card View",
};

export default CardViewStory;
