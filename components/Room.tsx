import { Fact } from "data/Facts";
import { scanIndex, useIndex, useMutations } from "hooks/useReplicache";
import { usePreserveScroll } from "hooks/utils";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { CalendarRoom } from "./CalendarRoom";
import { CardCollection } from "./CardCollection";
import { useFilteredCards, Filters, FilterByReactions } from "./CardFilter";
import { Discussion } from "./CardView/Discussion";
import { Desktop } from "./Desktop";
import { GoToTop, MoreOptionsTiny } from "./Icons";
import { Divider } from "./Layout";
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
      id="room-wrapper"
      ref={ref}
      className="no-scrollbar flex h-full w-[336px] flex-col items-stretch overflow-x-hidden overflow-y-scroll p-2 pt-0 text-sm sm:p-4 sm:pt-0 "
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
          <div className="flex  grow flex-col  gap-2 pb-3">
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
            <div className="desktopBackground absolute h-full  w-full grow" />
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
  let [descriptionOpen, setDescriptionOpen] = useState(false);
  let [scrolledTop, setScrolledTop] = useState(true);

  let [titleRef, { height: titleHeight }] = useMeasure();
  let [descriptionRef, { height: descriptionHeight }] = useMeasure();

  useEffect(() => {
    let roomWrapper = document.getElementById("room-wrapper");
    const onScroll = (event: Event) => {
      if (roomWrapper?.scrollTop === 0) {
        setScrolledTop(true);
      } else {
        setScrolledTop(false);
      }
    };

    roomWrapper?.addEventListener("scroll", onScroll);
    return () => {
      roomWrapper?.removeEventListener("scroll", onScroll);
    };
  }, []);

  let roomName: Fact<"room/name"> | Fact<"member/name"> | null = null;
  let sharedRoomName = useIndex.eav(props.entityID, "room/name");
  let memberRoomName = useIndex.eav(props.entityID, "member/name");
  if (memberRoomName) {
    roomName = memberRoomName;
  } else roomName = sharedRoomName;

  let { authorized } = useMutations();

  return (
    <>
      <div
        className="roomHeader sticky top-0 z-20 bg-background pt-2 sm:pt-4"
        ref={titleRef}
      >
        <div className="roomTitle flex justify-between text-lg font-bold text-grey-35">
          <p
            className={!descriptionOpen ? "mb-2 cursor-pointer" : "mb-2"}
            onClick={() => setDescriptionOpen(!descriptionOpen)}
          >
            {roomName?.value}
          </p>
          {authorized && (
            <div className="roomOptionsWrapper mt-[2px]">
              {descriptionOpen || scrolledTop ? (
                <RoomOptions entityID={props.entityID} />
              ) : (
                <button
                  onClick={() =>
                    document.getElementById("room-wrapper")?.scrollTo({
                      top: 0,
                      left: 0,
                      behavior: "smooth",
                    })
                  }
                >
                  <GoToTop />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={` z-10 bg-background pb-3 ${
          descriptionOpen ? "sticky" : ""
        }`}
        style={{ top: `${titleHeight}px` }}
        ref={descriptionRef}
      >
        <RoomDescription
          entityID={props.entityID}
          reactions={props.reactions}
          filters={props.filters}
          setFilters={props.setFilters}
        />
      </div>
      <div
        className="sticky z-10 mb-3 bg-background  "
        style={
          descriptionOpen
            ? { top: `calc(${titleHeight}px + ${descriptionHeight}px)` }
            : { top: `${titleHeight}px` }
        }
      >
        <Divider />
      </div>
    </>
  );
}

const RoomDescription = (props: {
  reactions: string[];
  filters: Filters;
  setFilters: (f: (old: Filters) => Filters) => void;
  entityID: string;
}) => {
  let roomDescription = useIndex.eav(props.entityID, "room/description");
  let roomType = useIndex.eav(props.entityID, "room/type");

  return (
    <div id="roomDescription" className="flex flex-col gap-2 ">
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
  );
};

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
