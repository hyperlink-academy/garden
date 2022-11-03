import { useIndex, useMutations } from "hooks/useReplicache";
import { Disclosure } from "@headlessui/react";
import useMeasure from "react-use-measure";
import { animated, SpringValue, useSpring } from "@react-spring/web";
import { spacePath, usePrevious } from "hooks/utils";
import { useState } from "react";
import { ButtonLink, ButtonTertiary } from "./Buttons";
import Link from "next/link";
import { DeckAdd, Settings } from "./Icons";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";
import { useRouter } from "next/router";
import { SmallCardList } from "./SmallCardList";
import { SingleTextSection } from "./CardView/Sections";

export const DeckList = () => {
  let homeEntity = useIndex.aev("home");
  let decks = useIndex.eav(homeEntity[0]?.entity || null, "deck/contains");

  return (
    <div className="flex flex-col pt-6 pb-0">
      {decks?.sort(sortByPosition("aev")).map((d) => (
        <Deck entity={d.value.value} key={d.value.value} />
      ))}
      <CreateDeck lastDeckPosition={decks?.[decks.length - 1]?.positions.aev} />
    </div>
  );
};

const CreateDeck = (props: {
  lastDeckPosition?: string;
  homeEntity?: string;
}) => {
  let { authorized, mutate } = useMutations();
  if (authorized === false) {
    return null;
  } else
    return (
      <div className="pb-8 place-self-center">
        <ButtonTertiary
          content="Create a New Deck"
          icon={<DeckAdd />}
          onClick={() => {
            let entity = ulid();
            mutate("addDeck", {
              newEntity: entity,
              newHomeEntity: ulid(),
              name: "",
              position: generateKeyBetween(
                props.lastDeckPosition || null,
                null
              ),
            });
          }}
        />
      </div>
    );
};

let openStates: { [key: string]: boolean | undefined } = {};

const Deck = (props: { entity: string }) => {
  let cards = useIndex.eav(props.entity, "deck/contains");
  let cardsCount = cards ? cards.length : 0;

  let [drawerOpen, setDrawerOpen] = useState(openStates[props.entity]);

  let router = useRouter();

  return (
    <Disclosure as="div" className="pb-8">
      <div className="flex pb-2 gap-10 w-full ">
        <button onClick={() => setDrawerOpen(!drawerOpen)}>
          <DeckImage count={cardsCount} open={!!drawerOpen} />
        </button>
        <DeckTitle entityID={props.entity} />
      </div>
      <Drawer open={!!drawerOpen}>
        <div className="flex flex-col gap-4">
          <SmallCardList
            attribute="deck/contains"
            positionKey="eav"
            deck={props.entity}
            cards={cards || []}
          />

          <Link
            href={`${spacePath(router.query.studio, router.query.space)}/c/${
              props.entity
            }`}
          >
            <ButtonLink content="Deck Info" icon={<Settings />} />
          </Link>
        </div>
      </Drawer>
    </Disclosure>
  );
};

const DeckImage = (props: { count: number; open: boolean }) => {
  const { rot1, rot2, xyz1, xyz2 } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    to: {
      rot1: props.open ? -6 : 3,
      rot2: props.open ? 12 : 6,
      xyz1: props.open ? [-8, -8, 0] : [0, 0, 0],
      xyz2: props.open ? [-2, 10, 0] : [0, 0, 0],
    },
  });

  return (
    <div className="pr-8 z-0 w-[64px] h-[110px] relative hover:scale-105 transition-transform cursor-pointer">
      <span className="text-accent-red text-lg font-bold italic absolute bottom-2 right-2 z-[1]">
        {props.count}
      </span>
      <div className="border rounded-lg w-[64px] h-[110px] absolute bg-white">
        {props.count === 0 ? (
          <EmptyDeck open={props.open} />
        ) : (
          <>
            <AnimatedCardRotate
              rot={rot1}
              transform={xyz1}
              className=" bottom-1 left-1 -z-[2]"
            />
            <AnimatedCardRotate
              rot={rot2}
              transform={xyz2}
              className="bottom-2 left-2 -z-[3]"
            />
          </>
        )}
      </div>
    </div>
  );
};

const AnimatedCardRotate = (props: {
  rot: SpringValue<number>;
  transform: SpringValue<number[]>;
  className: string;
}) => {
  return (
    <animated.div
      style={{
        rotate: props.rot,
        transform: props.transform.to(
          (x: any, y: any, z: any) => `translate3d(${x}px, ${y}px, ${z}px)`
        ),
      }}
      className={`border rounded-lg w-[64px] h-[110px] absolute bg-white ${props.className}`}
    />
  );
};

const EmptyDeck = (props: { open: boolean }) => {
  const { xyzempty1, xyzempty2 } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    to: {
      xyzempty1: props.open ? [4, -2, 0] : [0, 0, 0],
      xyzempty2: props.open ? [8, -4, 0] : [0, 0, 0],
    },
  });
  return (
    <>
      <animated.div
        style={{
          transform: xyzempty1.to(
            (x: any, y: any, z: any) => `translate3d(${x}px, ${y}px, ${z}px)`
          ),
        }}
        className="border border-dotted rounded-lg w-[64px] h-[110px] absolute bg-background bottom-1 left-1 -z-[2]"
      ></animated.div>
      <animated.div
        style={{
          transform: xyzempty2.to(
            (x: any, y: any, z: any) => `translate3d(${x}px, ${y}px, ${z}px)`
          ),
        }}
        className="border border-dotted rounded-lg w-[64px] h-[110px] absolute bg-background bottom-2 left-2 -z-[3]"
      ></animated.div>
    </>
  );
};

export const Drawer: React.FC<{
  open: boolean;
  bump?: number;
  skipAnimation?: boolean;
}> = (props) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height, arrowHeight } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    immediate: props.skipAnimation,
    from: { height: 0, opacity: 0, arrowHeight: 0 },
    to: {
      arrowHeight: props.open ? 100 : 0,
      height: props.open ? viewHeight : 0,
    },
  });
  let bump = props.bump || 0;

  return (
    <animated.div
      style={{
        height: props.open && previousState === props.open ? "auto" : height,
        overflow: "hidden",
      }}
      className="-mx-4"
    >
      <Disclosure.Panel static>
        <div
          className="bg-bg-drawer"
          ref={ref}
          style={{
            boxShadow:
              "rgb(0 0 0 / 25%) 0px -4px 4px -4px inset, rgb(0 0 0 / 25%) 0px 6px 6px -6px inset",
          }}
        >
          <div
            style={{
              height: "48px",
              marginBottom: "-32px",
              filter: "drop-shadow(rgba(0, 0, 0, 0.25) 0px 1px 2px)",
              clipPath:
                "polygon(0 0, 0 100%, 34px 100%,  50px 100%, 66px 100%, 100% 100%, 100% 0)",
              overflow: "hidden",
            }}
          >
            <animated.div
              className="bg-background mb-2"
              style={{
                width: "100%",
                height: "16px",
                clipPath:
                  props.open && previousState === props.open
                    ? `polygon(0 0,
                    0 100%,
                    ${bump + 34}px 100%,
                    ${bump + 50}px 0,
                    ${bump + 66}px 100%,
                    100% 100%,
                    100% 0)`
                    : arrowHeight.to(
                        (h) =>
                          `polygon(0 0,
                          0 ${h}%,
                          ${bump + 34}px ${h}%,
                          ${bump + 50}px 0,
                          ${bump + 66}px ${h}%,
                          100% ${h}%,
                          100% 0)`
                      ),
              }}
            />
          </div>
          <div className="pb-4 pt-6 px-4">{props.children}</div>
        </div>
      </Disclosure.Panel>
    </animated.div>
  );
};

const DeckTitle = (props: { entityID: string }) => {
  let [descriptionFocused, setDescriptionFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <SingleTextSection
        entityID={props.entityID}
        section="card/title"
        className="font-bold"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setDescriptionFocused(true);
          }
        }}
      />
      <SingleTextSection
        section="card/content"
        entityID={props.entityID}
        focused={descriptionFocused}
        placeholder="add a description..."
        onBlur={() => setDescriptionFocused(false)}
      />
    </div>
  );
};
