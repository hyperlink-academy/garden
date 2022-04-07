import { useIndex } from "hooks/useReplicache";
import { Disclosure, Transition } from "@headlessui/react";
import useMeasure from "react-use-measure";
import { SmallCard } from "components/SmallCard";
import { animated, useSpring, useTransition } from "react-spring";
import { usePrevious } from "hooks/utils";
import { FindOrCreateCard } from "./FindOrCreateCard";

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
        {({ open }) => {
          return (
            <>
              <Disclosure.Button as="div">
                <h3 className="text-grey-35 text-xl">{title?.value}</h3>
                {description?.value}
              </Disclosure.Button>
              <Drawer open={open}>
                <SmallCardList cards={cards?.map((c) => c.value.value) || []} />
              </Drawer>
            </>
          );
        }}
      </Disclosure>
    </div>
  );
};

export const Drawer: React.FC<{ open: boolean }> = (props) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height, arrowHeight } = useSpring({
    from: { height: 0, opacity: 0, arrowHeight: 0 },
    to: {
      arrowHeight: props.open ? 100 : 0,
      height: props.open ? viewHeight : 0,
    },
  });
  console.log(arrowHeight);
  return (
    <animated.div
      style={{
        height: props.open && previousState === props.open ? "auto" : height,
        overflow: "hidden",
      }}
    >
      <Disclosure.Panel static>
        <div
          className="bg-bg-drawer"
          ref={ref}
          style={{
            boxShadow:
              "inset 0px -4px 3px -3px rgba(0, 0, 0, 0.25), inset 0px 9px 6px -6px rgba(0, 0, 0, 0.25)",
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
            <animated.div
              className="bg-background mb-2"
              style={{
                width: "100%",
                height: "16px",
                clipPath: arrowHeight.to(
                  (h) =>
                    `polygon(0 0, 0 ${h}% , 20px ${h}% ,  36px 0, 52px ${h}%, 100% ${h}%, 100% 0)`
                ),
              }}
            />
          </div>
          <div className="pb-4">{props.children}</div>
        </div>
      </Disclosure.Panel>
    </animated.div>
  );
};

export const SmallCardList = (props: { cards: string[] }) => {
  return (
    <div className="flex flex-wrap gap-8 p-8">
      {props.cards.map((c) => (
        <SmallCard href="" entityID={c} />
      ))}
    </div>
  );
};
