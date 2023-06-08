import { Fact } from "data/Facts";
import { scanIndex, useIndex } from "hooks/useReplicache";
import { usePreserveScroll } from "hooks/utils";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { CalendarRoom } from "./CalendarRoom";
import { CardCollection } from "./CardCollection";
import { Discussion } from "./CardView/Discussion";
import { Desktop } from "./Desktop";
import { GoToTop, MoreOptionsTiny } from "./Icons";
import { SearchRoom } from "./SearchRoom";
import { EditRoomModal } from "./SpaceLayout/Sidebar/RoomListLayout";
import { RenderedText } from "./Textarea/RenderedText";
import * as z from "zod";
import { useSubscribe } from "hooks/useSubscribe";
import { sortByPosition } from "src/position_helpers";

let FilterVerifier = z.array(
  z.object({
    reaction: z.string(),
    not: z.boolean(),
  })
);
type Filters = z.TypeOf<typeof FilterVerifier>;

export const Room = (props: { entityID: string }) => {
  let roomType = useIndex.eav(props.entityID, "room/type");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  // CARD COLLECTION FILTERS
  let [filters, setFilters] = useState<Filters>([]);

  // set filter values based on local storage
  useEffect(() => {
    try {
      let filterString = window.localStorage.getItem(
        `cardCollectionFilters-${props.entityID}`
      );
      if (filterString) {
        let parsed = FilterVerifier.safeParse(JSON.parse(filterString));
        if (parsed.success) setFilters(parsed.data);
      }
    } catch (e) {}
  }, []);
  // save filter values to local storage every time the filters state is updated
  useEffect(() => {
    window.localStorage.setItem(
      `cardCollectionFilters-${props.entityID}`,
      JSON.stringify(filters)
    );
  }, [filters]);

  let cards = useCards(props.entityID, "desktop/contains");
  let reactions = cards.reduce((acc, card) => {
    for (let reaction of card.reactions) {
      if (!acc.includes(reaction)) acc.push(reaction);
    }
    return acc;
  }, [] as string[]);

  let cardsFiltered = cards.filter((card) => {
    let passed = true;
    for (let filter of filters) {
      if (filter.not)
        passed = passed && !card.reactions.includes(filter.reaction);
      else passed = passed && card.reactions.includes(filter.reaction);
    }
    return passed;
  });

  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;

  return (
    <div
      id="roomScrollContainer"
      ref={ref}
      className="no-scrollbar m-2 flex h-full w-[336px] flex-col gap-1 overflow-x-hidden overflow-y-scroll text-sm sm:m-4"
    >
      <RoomHeader
        entityID={props.entityID}
        reactions={reactions}
        filters={filters}
        setFilters={setFilters}
      />

      {/* per-room wrappers + components */}
      {props.entityID ? (
        roomType?.value === "collection" ? (
          <div className="flex min-h-[calc(100vh-132px)] flex-col gap-2">
            <CardCollection
              cards={cardsFiltered}
              entityID={props.entityID}
              attribute="desktop/contains"
            />
          </div>
        ) : roomType?.value === "chat" ? (
          <div className="flex h-full flex-col">
            <Discussion entityID={props.entityID} isRoom={true} />
          </div>
        ) : (
          <div className="relative flex flex-col">
            <Desktop entityID={props.entityID} />
            <div className="desktopBackground absolute h-full w-full" />
          </div>
        )
      ) : null}
    </div>
  );
};

function RoomHeader(props: {
  entityID: string;
  reactions: string[];
  filters: Filters;
  setFilters: (f: (old: Filters) => Filters) => void;
}) {
  const [isRoomDescriptionVisible, setIsRoomDescriptionVisible] =
    useState(true);
  const [
    isToggleableRoomDescriptionHidden,
    setIsToggleableRoomDescriptionHidden,
  ] = useState(false);
  let [titleRef, { height }] = useMeasure();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === "roomDescription") {
          setIsRoomDescriptionVisible(entry.isIntersecting);
          setIsToggleableRoomDescriptionHidden(true);
        }
      });
    });
    let roomDescription = document.getElementById("roomDescription");
    if (!roomDescription) return;
    observer.observe(roomDescription);
    return () => {
      observer.disconnect();
    };
  }, []);
  const toggleDescriptionVisibility = () => {
    if (!isRoomDescriptionVisible) {
      setIsToggleableRoomDescriptionHidden(!isToggleableRoomDescriptionHidden);
    }
  };
  let roomDescription = useIndex.eav(props.entityID, "room/description");
  let roomName: Fact<"room/name"> | Fact<"member/name"> | null = null;
  let sharedRoomName = useIndex.eav(props.entityID, "room/name");
  let memberRoomName = useIndex.eav(props.entityID, "member/name");
  if (memberRoomName) {
    roomName = memberRoomName;
  } else roomName = sharedRoomName;

  let descriptionRef = useRef<null | HTMLDivElement>(null);

  let roomType = useIndex.eav(props.entityID, "room/type");

  return (
    <>
      <div className="sticky top-0 z-10 bg-background" ref={titleRef}>
        <div className="flex justify-between text-lg font-bold text-grey-35">
          <p
            className={
              !isRoomDescriptionVisible ? "mb-2 cursor-pointer" : "mb-2"
            }
            onClick={toggleDescriptionVisibility}
          >
            {roomName?.value}
          </p>
          <div className="roomButtonWrapper mt-[2px]">
            {isRoomDescriptionVisible || !isToggleableRoomDescriptionHidden ? (
              <RoomOptions entityID={props.entityID} />
            ) : (
              <button
                onClick={() =>
                  descriptionRef?.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                  })
                }
              >
                <GoToTop />
              </button>
            )}
          </div>
        </div>

        {!isRoomDescriptionVisible && !isToggleableRoomDescriptionHidden && (
          <>
            <div
              id="roomDescription2"
              className="-mt-0 flex flex-col gap-2 pb-2"
            >
              {roomDescription?.value && (
                <RenderedText
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    width: "100%",
                  }}
                  className="pb-1 text-sm text-grey-35"
                  text={roomDescription?.value || ""}
                />
              )}

              {props.reactions.length > 0 ? (
                <div className="flex justify-between gap-2">
                  {roomType?.value === "collection" ? (
                    <FilterByReactions
                      reactions={props.reactions}
                      filters={props.filters}
                      setFilters={props.setFilters}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
      {/* allow expanded toggle if description OR reactions for filtering */}
      {roomDescription?.value || props.reactions.length > 0 ? (
        <div
          id="roomDescription"
          className="-mt-1 flex flex-col gap-2 pb-2"
          ref={descriptionRef}
        >
          {roomDescription?.value && (
            <RenderedText
              className="text-sm text-grey-35"
              id="roomDescriptionY"
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                width: "100%",
              }}
              text={roomDescription?.value || ""}
            />
          )}
          {props.reactions.length > 0 ? (
            <div className="flex justify-between gap-2">
              {roomType?.value === "collection" ? (
                <FilterByReactions
                  reactions={props.reactions}
                  filters={props.filters}
                  setFilters={props.setFilters}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <hr
        className="sticky z-10 mb-1 -mt-1 text-grey-80"
        style={{ top: `${height}px` }}
      />
    </>
  );
}

function RoomOptions(props: { entityID: string | null }) {
  const [isRoomEditOpen, setIsRoomEditOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsRoomEditOpen(true)}
        className={` flex rounded-md border border-transparent pt-[4px] align-top hover:border-white`}
      >
        <MoreOptionsTiny />
      </button>
      <EditRoomModal
        open={isRoomEditOpen}
        onClose={() => setIsRoomEditOpen(false)}
        currentRoom={props.entityID}
      />
    </>
  );
}

const useCards = (
  entityID: string,
  attribute: "desktop/contains" | "deck/contains"
) => {
  let cards = useSubscribe(
    async (tx) => {
      let allCards = await scanIndex(tx).eav(entityID, attribute);
      return Promise.all(
        allCards.sort(sortByPosition("eav")).map(async (card) => {
          let reactions = (
            await scanIndex(tx).eav(card.value.value, "card/reaction")
          ).map((r) => r.value);
          return { ...card, reactions };
        })
      );
    },
    [],
    [entityID, attribute],
    `${entityID}-cards`
  );
  return cards;
};

function FilterByReactions(props: {
  reactions: string[];
  filters: Filters;
  setFilters: (f: (old: Filters) => Filters) => void;
}) {
  return (
    <div className="flex flex-row flex-wrap gap-2">
      {props.reactions.map((reaction) => {
        let existingFilter = props.filters.find((f) => f.reaction === reaction);
        return (
          <button
            key={reaction}
            onClick={() => {
              props.setFilters((oldFilters) => {
                let existingFilter = oldFilters.find(
                  (f) => f.reaction === reaction
                );
                if (!existingFilter)
                  return [...oldFilters, { reaction, not: false }];
                if (existingFilter.not)
                  return oldFilters.filter((f) => f.reaction !== reaction);
                return oldFilters.map((f) =>
                  f.reaction === reaction ? { ...f, not: true } : f
                );
              });
            }}
            className={`text-md flex items-center gap-2 rounded-md border px-2 py-0.5 ${
              existingFilter
                ? existingFilter.not
                  ? "border-accent-red bg-bg-red"
                  : "border-accent-green bg-bg-green"
                : "border-grey-80"
            }`}
          >
            <strong>
              {existingFilter?.reaction === reaction &&
                (existingFilter.not ? "−" : "+")}{" "}
              {reaction}
            </strong>{" "}
          </button>
        );
      })}
      {props.filters.length > 0 && (
        <button onClick={() => props.setFilters(() => [])}>clear</button>
      )}
    </div>
  );
}
