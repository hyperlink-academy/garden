import { DeckList } from "components/DeckList";
import { flag, ref } from "data/Facts";
import { title } from "src/lorem";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
const entities: Stories = {
  Story1: {
    entities: [
      {
        deck: flag(),
        "card/title": "A Deck",
        "card/content": "THis is just a deck containing some cards",
        "deck/contains": [...Array(4).keys()].map((_a, id) =>
          ref((id + 1).toString())
        ),
      },
      ...[...Array(8).keys()].map(() => {
        return {
          "card/title": title(),
        };
      }),
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
