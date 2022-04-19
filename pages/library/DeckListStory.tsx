import { DeckList } from "components/DeckList";
import { flag, ref } from "data/Facts";
// import { title } from "src/lorem";
import {
  getRandomTitleBook,
  getRandomTitleOccupation,
  getRandomTitleWeird,
} from "src/corporeal";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";

const entities: Stories = {
  Story2: { entities: [] },
  Story1: {
    entities: [
      {
        deck: flag(),
        "card/title": "Big Bestsellers",
        "card/content": "Here's a deck of assorted bestselling books.",
        "deck/contains": [...Array(8).keys()].map((_a, id) =>
          ref((id + 3).toString())
        ),
      },
      {
        deck: flag(),
        "card/title": "Worship Strange Winds",
        "card/content":
          "In this deck, an intersection of fictional beliefs and winds playing instruments, a most interesting combination.",
        "deck/contains": [...Array(8).keys()].map((_a, id) =>
          ref((id + 11).toString())
        ),
      },
      {
        deck: flag(),
        "card/title": "What Can Ya Do",
        "card/content": "Moody occupations, the full breadth of humanity…",
        "deck/contains": [...Array(8).keys()].map((_a, id) =>
          ref((id + 19).toString())
        ),
      },
      ...[...Array(8).keys()].map(() => {
        return {
          "card/title": getRandomTitleBook(),
        };
      }),
      ...[...Array(8).keys()].map(() => {
        return {
          "card/title": getRandomTitleWeird(),
        };
      }),
      ...[...Array(8).keys()].map(() => {
        return {
          "card/title": getRandomTitleOccupation(),
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
