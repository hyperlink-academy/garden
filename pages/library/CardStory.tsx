import { Card } from "components/Card";
import { multipleReferenceSection, ref, singleTextSection } from "data/Facts";
import { title } from "src/lorem";
import { ComponentViewer, Props, Stories } from "./index";
export { getStaticProps } from "./index";

const Stories: Stories = {
  default: {
    attributes: {
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
    },
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
      ...[...Array(4).keys()].map(() => {
        return {
          "card/title": title(),
        };
      }),
      {
        name: multipleReferenceSection("Quotes"),
        cardinality: "many",
        type: "reference",
      },
      {
        name: singleTextSection("Text Section"),
        cardinality: "one",
        type: "string",
      },
    ],
  },
};

const CardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={Stories}>
      <Card entityID={"0"} />
    </ComponentViewer>
  );
};

CardStory.metadata = {
  name: "Card",
};

export default CardStory;
