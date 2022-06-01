import { useIndex, useMutations } from "hooks/useReplicache";
import { Disclosure } from "@headlessui/react";
import useMeasure from "react-use-measure";
import { animated, SpringValue, useSpring } from "react-spring";
import { usePrevious } from "hooks/utils";
import { useEffect, useRef, useState } from "react";
import { FindOrCreateCard } from "./FindOrCreateEntity";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import Link from "next/link";
import { CardAdd, DeckAdd, Settings } from "./Icons";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";
import { useRouter } from "next/router";
import { SmallCardList } from "./SmallCardList";
import { Textarea } from "./Textarea";

export const DeckList = () => {
  let decks = useIndex.aev("deck").sort(sortByPosition("aev"));
  let [toggleAll, setToggleAll] = useState<boolean | undefined>(undefined);

  return (
    <div className="flex flex-col pt-6 pb-0">
      {/* <div className="pb-8 flex flex-col sm:flex-row justify-between">
        <div className="self-left sm:self-center py-2">
          <ButtonLink
            onClick={() => setToggleAll(!toggleAll)}
            content="toggle all"
          />
        </div>
      </div> */}

      {decks.map((d) => (
        <Deck entity={d.entity} toggleAll={toggleAll} key={d.entity} />
      ))}
      <CreateDeck lastDeckPosition={decks[decks.length - 1]?.positions.aev} />
    </div>
  );
};

const CreateDeck = (props: { lastDeckPosition?: string }) => {
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

const Deck = (props: { entity: string; toggleAll: boolean | undefined }) => {
  let title = useIndex.eav(props.entity, "card/title");
  let { authorized } = useMutations();
  let description = useIndex.eav(props.entity, "card/content");
  let cards = useIndex.eav(props.entity, "deck/contains");
  let cardsCount = cards ? cards.length : 0;
  let lastCard = cards?.sort(sortByPosition("eav"))[cards.length - 1];

  let [findOpen, setFindOpen] = useState(false);
  let [drawerOpen, setDrawerOpen] = useState(openStates[props.entity]);

  let router = useRouter();

  useEffect(() => {
    openStates[props.entity] = drawerOpen;
  }, [drawerOpen]);
  useEffect(() => {
    if (props.toggleAll !== undefined) setDrawerOpen(props.toggleAll);
  }, [props.toggleAll]);

  return (
    <Disclosure as="div" className="pb-8">
      <div className="flex pb-2 gap-4 justify-between">
        <div className="flex gap-10 w-full">
          <button
            onClick={(e) => {
              setDrawerOpen(!drawerOpen);
            }}
          >
            <DeckImage count={cardsCount} open={!!drawerOpen} />
          </button>
          <DeckTitle entityID={props.entity} />
        </div>
      </div>
      <Drawer open={!!drawerOpen}>
        <div className="flex flex-col gap-4">
          {cardsCount > 0 ? (
            <SmallCardList
              attribute="deck/contains"
              positionKey="eav"
              deck={props.entity}
              cards={cards || []}
            />
          ) : (
            <div className="italic place-self-center text-grey-55">
              no cards yet!
            </div>
          )}
          {!authorized ? (
            <div className="-mb-2" />
          ) : (
            <div className="place-items-center place-self-end flex flex-row gap-4">
              <Link
                href={`/s/${router.query.studio}/s/${router.query.space}/c/${props.entity}`}
              >
                <a>
                  <ButtonLink content="Deck Overview" icon={<Settings />} />
                </a>
              </Link>

              <ButtonPrimary
                onClick={() => setFindOpen(true)}
                icon={<CardAdd />}
                content="Add cards"
              />

              <FindOrCreateCard
                allowBlank={true}
                entity={props.entity}
                positionKey="eav"
                lastPosition={lastCard?.positions["eav"]}
                section="deck/contains"
                open={findOpen}
                onClose={() => setFindOpen(false)}
                selected={cards?.map((c) => c.value.value) || []}
              />
            </div>
          )}
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

export const Drawer: React.FC<{ open: boolean }> = (props) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height, arrowHeight } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    from: { height: 0, opacity: 0, arrowHeight: 0 },
    to: {
      arrowHeight: props.open ? 100 : 0,
      height: props.open ? viewHeight : 0,
    },
  });

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
                    ? `polygon(0 0, 0 100%, 34px 100%,  50px 0, 66px 100%, 100% 100%, 100% 0)`
                    : arrowHeight.to(
                        (h) =>
                          `polygon(0 0, 0 ${h}%, 34px ${h}%, 50px 0, 66px ${h}%, 100% ${h}%, 100% 0)`
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
  let DeckTitle = useIndex.eav(props.entityID, "card/title");
  let DeckDescription = useIndex.eav(props.entityID, "card/content");
  let { authorized, mutate } = useMutations();
  let [descriptionFocused, setDescriptionFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {!authorized ? (
        <h2>{DeckTitle ? DeckTitle?.value : "Untitled"}</h2>
      ) : (
        <Textarea
          placeholder="Untitled Deck"
          className="text-xl font-bold bg-inherit"
          value={DeckTitle?.value}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setDescriptionFocused(true);
            }
          }}
          onChange={async (e) => {
            await mutate("assertFact", {
              entity: props.entityID,
              attribute: "card/title",
              value: e.currentTarget.value,
              positions: DeckTitle?.positions || {},
            });
          }}
        />
      )}
      {!authorized ? (
        <p>{DeckDescription ? DeckDescription?.value : ""}</p>
      ) : (
        <Textarea
          focused={descriptionFocused}
          onBlur={() => setDescriptionFocused(false)}
          placeholder={DeckTitle?.value === "" ? "add a description..." : ""}
          className="bg-inherit placeholder:italic"
          value={DeckDescription?.value}
          onChange={async (e) => {
            await mutate("assertFact", {
              entity: props.entityID,
              attribute: "card/content",
              value: e.currentTarget.value,
              positions: DeckTitle?.positions || {},
            });
          }}
        />
      )}
    </div>
  );
};
