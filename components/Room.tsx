import { Fact } from "data/Facts";
import { scanIndex, useIndex } from "hooks/useReplicache";
import { usePreserveScroll } from "hooks/utils";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { CalendarRoom } from "./CalendarRoom";
import { CardCollection } from "./CardCollection";
import { useFilteredCards, Filters, FilterByReactions } from "./CardFilter";
import { Discussion } from "./CardView/Discussion";
import { Desktop } from "./Desktop";
import { GoToTop, MoreOptionsTiny } from "./Icons";
import { SearchRoom } from "./SearchRoom";
import { EditRoomModal } from "./SpaceLayout/Sidebar/RoomListLayout";
import { RenderedText } from "./Textarea/RenderedText";

export const Room = (props: { entityID: string }) => {
  let roomType = useIndex.eav(props.entityID, "room/type");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  let { reactions, filters, setFilters, cardsFiltered } = useFilteredCards(
    props.entityID,
    "desktop/contains"
  );

  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;

  return (
    <div
      id="roomScrollContainer"
      ref={ref}
      className="no-scrollbar flex h-full w-[336px] flex-col gap-1 overflow-x-hidden overflow-y-scroll p-2 pt-0 text-sm sm:p-4 sm:pt-0 "
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
          <Discussion entityID={props.entityID} isRoom={true} />
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
      <div
        className="sticky top-0 z-10 bg-background pt-2 sm:pt-4"
        ref={titleRef}
      >
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
