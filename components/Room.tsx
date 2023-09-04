import { Fact } from "data/Facts";
import { db, useMutations } from "hooks/useReplicache";
import { usePreserveScroll } from "hooks/utils";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { CalendarRoom } from "./CalendarRoom";
import { CardCollection } from "./CardCollection";
import { useFilteredCards, Filters, FilterByReactions } from "./CardFilter";
import { Discussion } from "./CardView/Discussion";
import { Desktop } from "./Desktop";
import {
  CollectionListTiny,
  CollectionPreviewTiny,
  GoToTop,
  MoreOptionsTiny,
} from "./Icons";
import { Divider } from "./Layout";
import { SearchRoom } from "./SearchRoom";
import { UnreadsRoom } from "./UnreadsRoom";
import { EditRoomModal } from "./SpaceLayout/Sidebar/RoomListLayout";
import { RenderedText } from "./Textarea/RenderedText";
import { ulid } from "src/ulid";

export const Room = (props: { entityID: string }) => {
  let roomType = db.useEntity(props.entityID, "room/type");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  let { reactions, filters, setFilters, cardsFiltered, total } =
    useFilteredCards(props.entityID, "desktop/contains");

  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;
  if (props.entityID === "unreads") return <UnreadsRoom />;

  return (
    <div
      id="room-wrapper"
      ref={ref}
      className="no-scrollbar flex h-full w-[336px] flex-col items-stretch overflow-x-hidden overflow-y-scroll p-2 pt-0 text-sm sm:p-4 sm:pt-0"
    >
      <RoomHeader
        totalCount={total}
        filteredCount={cardsFiltered.length}
        entityID={props.entityID}
        reactions={reactions}
        filters={filters}
        setFilters={setFilters}
      />

      {/* per-room wrappers + components */}
      {props.entityID ? (
        roomType?.value === "collection" ? (
          <div className="flex grow flex-col gap-2 pb-3">
            <CardCollection
              cards={cardsFiltered}
              entityID={props.entityID}
              attribute="desktop/contains"
              openOnAdd
            />
          </div>
        ) : roomType?.value === "chat" ? (
          <Discussion entityID={props.entityID} isRoom={true} />
        ) : (
          <div className="relative flex flex-col">
            <Desktop entityID={props.entityID} />
            <div className="desktopBackground absolute h-full w-full grow" />
          </div>
        )
      ) : null}
    </div>
  );
};

function RoomHeader(props: {
  filteredCount: number;
  totalCount: number;
  entityID: string;
  reactions: string[];
  filters: Filters;
  setFilters: (f: (old: Filters) => Filters) => void;
}) {
  let roomType = db.useEntity(props.entityID, "room/type");
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
  let sharedRoomName = db.useEntity(props.entityID, "room/name");
  let memberRoomName = db.useEntity(props.entityID, "member/name");
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
        <div className="roomTitle flex justify-between">
          <button
            className={`mb-1 text-lg font-bold text-grey-35 `}
            onClick={() => {
              if (!scrolledTop) {
                setDescriptionOpen(!descriptionOpen);
              } else return;
            }}
          >
            {roomName?.value}{" "}
            {roomType?.value === "collection" ? (
              <span className="text-sm text-grey-35">
                (
                {props.totalCount === props.filteredCount
                  ? props.totalCount
                  : `${props.filteredCount}/${props.totalCount}`}
                )
              </span>
            ) : null}
          </button>
          {authorized && (
            <div className="roomOptionsWrapper mt-[4px]">
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
        className={`roomDescriptionAndFilter z-10 bg-background ${descriptionOpen ? "sticky" : ""
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
        className="roomDivider sticky z-10 mb-3 bg-background pt-2"
        style={
          descriptionOpen
            ? { top: `calc(${titleHeight}px + ${descriptionHeight}px)` }
            : { top: `calc(${titleHeight}px)` }
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
  let roomDescription = db.useEntity(props.entityID, "room/description");
  let roomType = db.useEntity(props.entityID, "room/type");
  let currentCollectionType = db.useEntity(props.entityID, "collection/type");
  let [filtersOpen, setFiltersOpen] = useState(false);
  // let [collectionType, setCollectionType] = useState(
  //   currentCollectionType?.value
  // );

  // useEffect(() => {
  //   setCollectionType(currentCollectionType?.value);
  // }, [currentCollectionType?.value]);

  return (
    <>
      <div id="roomDescription" className="flex flex-col gap-2">
        {roomDescription?.value && (
          <RenderedText
            className="text-base text-grey-35"
            id="roomDescriptionY"
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              width: "100%",
              zIndex: 10,
            }}
            text={roomDescription?.value || ""}
          />
        )}
        {roomType?.value === "collection" ? (
          <div className="flex flex-col gap-1 pt-2">
            <div className="roomFilterAndToggle flex justify-between text-sm">
              <CollectionType
                collectionType={currentCollectionType?.value}
                entityID={props.entityID}
              />
              <button
                className={`${props.filters.length === 0
                    ? "text-grey-55 underline"
                    : "font-bold text-accent-blue"
                  }`}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                filters({props.filters.length})
              </button>
            </div>
            <div className={`${filtersOpen ? "" : "hidden"}`}>
              <FilterByReactions
                reactions={props.reactions}
                filters={props.filters}
                setFilters={props.setFilters}
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
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

export const CollectionType = (props: {
  entityID: string;

  collectionType: Fact<"collection/type">["value"] | undefined;
}) => {
  let type = props.collectionType || "list";
  let { mutate } = useMutations();

  const onClick = (value: Fact<"collection/type">["value"]) => async () => {
    await mutate("assertFact", {
      entity: props.entityID,
      factID: ulid(),
      attribute: "collection/type",
      value: value,
      positions: {},
    });
  };
  const className = (typeName: Fact<"collection/type">["value"]) =>
    `p-0.5 text-grey-55 ${type === typeName
      ? "rounded-md border border-grey-55"
      : "border border-transparent"
    }`;

  return (
    <div className="collectionTypeSelector flex flex-row items-center gap-1">
      {/* <p className="pr-1 text-sm text-grey-55">view</p> */}
      <button
        className={`${className("list")} shrink-0`}
        onClick={onClick("list")}
      >
        <CollectionListTiny />
      </button>
      <button
        className={`${className("cardpreview")} shrink-0`}
        onClick={onClick("cardpreview")}
      >
        <CollectionPreviewTiny />
      </button>
    </div>
  );
};
