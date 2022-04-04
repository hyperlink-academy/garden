import { FindOrCreateCard } from "components/FindOrCreateCard";
import { useIndex } from "hooks/useReplicache";
import { title } from "src/lorem";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
import { Card, Deck } from "components/Icons";
import { useState } from "react";
const entities: Stories = {
  None: {
    entities: [],
  },
  Few: {
    entities: [...Array(8).keys()].map((_a, index) => {
      return {
        id: index.toString(),
        facts: [{ attribute: "card/title", value: title() }],
      };
    }),
  },
  Many: {
    entities: [...Array(32).keys()].map((_a, index) => {
      return {
        id: index.toString(),
        facts: [{ attribute: "card/title", value: title() }],
      };
    }),
  },
};

const FindOrCreateCardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={entities}>
      <Story />
    </ComponentViewer>
  );
};

const Story = () => {
  let [open, setOpen] = useState(false);
  let [selectedCard, setSelectedCard] = useState("");
  let decks = useIndex.aev("deck");
  let titles = useIndex.aev("card/title");
  return (
    <>
      <div onClick={() => setOpen(true)}>FindOrCreateCard</div>
      <FindOrCreateCard
        open={open}
        selectedCard={selectedCard}
        onClose={() => setOpen(false)}
        onSelect={(e) => {
          setOpen(false);
          setSelectedCard(e.value);
        }}
        items={titles.map((t) => {
          return {
            name: t.value,
            icon: decks.find((d) => d.entity === t.entity) ? (
              <Deck />
            ) : (
              <Card />
            ),
          };
        })}
      />
    </>
  );
};

FindOrCreateCardStory.metadata = {
  name: "Find or Create card",
};

export default FindOrCreateCardStory;
