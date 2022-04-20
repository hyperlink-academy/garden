import { FindOrCreate } from "components/FindOrCreateEntity";
import { title } from "src/lorem";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
import { useState } from "react";
import { ButtonLink } from "components/Buttons";
import { useIndex } from "hooks/useReplicache";
import { Card, DeckSmall } from "components/Icons";
import { SmallCard } from "components/SmallCard";
const entities: Stories = {
  None: {
    entities: [],
  },
  Few: {
    entities: [...Array(8).keys()].map(() => {
      return {
        "card/title": title(),
      };
    }),
  },
  Many: {
    entities: [...Array(32).keys()].map(() => {
      return {
        "card/title": title(),
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
  let [selectedCards, setSelectedCards] = useState<string[]>([]);
  let decks = useIndex.aev("deck");
  let titles = useIndex.aev("card/title");
  let items = titles.map((t) => {
    return {
      entity: t.entity,
      display: t.value,
      icon: !!decks.find((d) => t.entity === d.entity) ? (
        <DeckSmall />
      ) : (
        <Card />
      ),
    };
  });
  return (
    <>
      <div
        className={`w-full bg-white border border-grey-55 italic text-grey-55 p-2 rounded-md`}
        onClick={() => setOpen(true)}
      >
        find or create cards...
      </div>
      <FindOrCreate
        allowBlank={true}
        open={open}
        items={items}
        onClose={() => setOpen(false)}
        selected={selectedCards}
        onSelect={(e) => {
          if (e.type == "existing") {
            setSelectedCards((s) => [...s, e.entity]);
          }
        }}
      />
      <ul>
        {selectedCards.map((c) => {
          return (
            <li>
              {c}{" "}
              <ButtonLink
                content="delete"
                onClick={() =>
                  setSelectedCards((cards) => cards.filter((c1) => c1 !== c))
                }
              />
            </li>
          );
        })}
      </ul>
    </>
  );
};

FindOrCreateCardStory.metadata = {
  name: "Find or Create card",
};

export default FindOrCreateCardStory;
