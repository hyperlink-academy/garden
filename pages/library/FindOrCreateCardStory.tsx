import { FindOrCreateCard } from "components/FindOrCreateCard";
import { title } from "src/lorem";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
import { useState } from "react";
import { ButtonLink } from "components/Buttons";
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
  return (
    <>
      <div onClick={() => setOpen(true)}>FindOrCreateCard</div>
      <FindOrCreateCard
        open={open}
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
