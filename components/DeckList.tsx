import { useIndex } from "hooks/useReplicache";
import { Disclosure, Transition } from "@headlessui/react";
import { useState } from "react";
import { SmallCard } from "components/SmallCard";

export const DeckList = () => {
  let decks = useIndex.aev("deck");
  return (
    <div>
      <button>CreateNewDeck</button>
      {decks.map((d) => (
        <Deck entity={d.entity} />
      ))}
    </div>
  );
};

const Deck = (props: { entity: string }) => {
  let title = useIndex.eav(props.entity, "card/title");
  let description = useIndex.eav(props.entity, "card/content");
  let cards = useIndex.eav(props.entity, "deck/contains");
  return (
    <div>
      <Disclosure>
        <Disclosure.Button as="div">
          <h3 className="text-grey-35 text-xl">{title?.value}</h3>
          {description?.value}
        </Disclosure.Button>

        <Transition
          enter="transition-[max-height] duration-500 ease-out"
          enterFrom="max-h-2 overflow-hidden"
          enterTo="max-h-96 overflow-hidden"
          leave="transition-[max-height] duration-500 ease-out"
          leaveFrom="max-h-96 overflow-hidden"
          leaveTo="max-h-2 overflow-hidden"
        >
          <Drawer>
            <SmallCardList cards={cards?.map((c) => c.value.value) || []} />
          </Drawer>
        </Transition>
      </Disclosure>
    </div>
  );
};

export const Drawer: React.FC = (props) => {
  return (
    <Disclosure.Panel>
      <div
        className="bg-bg-drawer"
        style={{
          boxShadow:
            "inset 0px -4px 3px -3px rgba(0, 0, 0, 0.25), inset 0px 9px 6px -6px rgba(0, 0, 0, 0.25)",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "64px",
            marginBottom: "-32px",
            filter:
              "drop-shadow(0 -1px 3px rgb(0, 0, 0, 0.25)) drop-shadow(0 3px 6px rgb(0, 0, 0, 0.25))",
            clipPath:
              "polygon(0 0, 0 100% , 20px 100% ,  36px 100%, 52px 100%, 100% 100%, 100% 0)",
            overflow: "hidden",
          }}
        >
          <div
            className="bg-background mb-2"
            style={{
              width: "100%",
              height: "16px",
              clipPath:
                "polygon(0 0, 0 100% , 20px 100% ,  36px 0, 52px 100%, 100% 100%, 100% 0)",
            }}
          />
        </div>
        <div className="pb-4">{props.children}</div>
      </div>
    </Disclosure.Panel>
  );
};

export const SmallCardList = (props: { cards: string[] }) => {
  return (
    <div>
      {props.cards.map((c) => (
        <SmallCard href="" entityID={c} />
      ))}
    </div>
  );
};
