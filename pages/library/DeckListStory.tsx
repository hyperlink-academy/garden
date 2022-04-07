import { DeckList } from "components/DeckList";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
const entities: Stories = {
  Story1: {
    entities: [
      {
        id: "1",
        facts: [
          { attribute: "deck", value: { type: "flag" } },
          { attribute: "card/title", value: "A Deck" },
          {
            attribute: "card/content",
            value: "This is just a deck containing some cards",
          },
          {
            attribute: "deck/contains",
            value: { type: "reference", value: "2" },
          },
        ],
      },
      {
        id: "2",
        facts: [
          { attribute: "card/title", value: "A Card" },
          {
            attribute: "card/content",
            value: "This is just some content yo",
          },
        ],
      },
    ],
  },
};

const DeckListStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={entities}>
      <DeckList />
    </ComponentViewer>
  );
};

DeckListStory.metadata = {
  name: "Deck List",
};

export default DeckListStory;
