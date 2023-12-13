import { Fact } from "data/Facts";
import { db, scanIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { usePreserveScroll } from "hooks/utils";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { CalendarRoom } from "./CalendarRoom";
import { CardCollection } from "./CardCollection";
import { useFilteredCards, Filters, FilterByReactions } from "./CardFilter";
import { DiscussionRoom } from "./CardView/Discussion";
import { Desktop } from "./Desktop";
import {
  CardAddLarge,
  CollectionListTiny,
  CollectionPreviewTiny,
  GoToTop,
  MoreOptionsTiny,
  RoomCollection,
} from "./Icons";
import { Divider } from "./Layout";
import { UnreadsRoom } from "./UnreadsRoom";
import { EditRoomModal } from "./SpaceLayout/Sidebar/RoomListLayout";
import { RenderedText } from "./Textarea/RenderedText";
import { ulid } from "src/ulid";
import { useAuth } from "hooks/useAuth";
import { getAndUploadFile } from "src/getAndUploadFile";
import { create } from "components/CardStack";
import { useDraggableCard } from "./DragContext";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { useRoom } from "hooks/useUIState";
import { SingleTextSection } from "./CardView/Sections";
import { useCardViewer } from "./CardViewerContext";
import { Textarea } from "./Textarea";

export const Room = () => {
  let { open } = useCardViewer();
  let room = useRoom();
  let roomType = db.useEntity(room, "room/type");
  let { ref } = usePreserveScroll<HTMLDivElement>(room);
  let { reactions, filters, setFilters, cardsFiltered, total } =
    useFilteredCards(room, "desktop/contains");

  let { authToken } = useAuth();
  let { mutate, rep, action, memberEntity } = useMutations();
  let spaceID = useSpaceID();

  if (room === "calendar") return <CalendarRoom />;
  if (room === "unreads") return <UnreadsRoom />;
  if (roomType?.value === "chat")
    return (
      <div className="flex h-full w-[336px]">
        <DiscussionRoom entityID={room} isRoom />
      </div>
    );

  return (
    <div
      id="room-wrapper"
      onPaste={async (e) => {
        //handles creating a new image card if you paste in an image
        if (!authToken || !spaceID || !roomType || !rep || !memberEntity)
          return;
        if (roomType.value === "chat") return;
        let data = await getAndUploadFile(
          e.clipboardData.items,
          authToken,
          spaceID
        );
        if (!data.success) return;

        //prevent image from opening in new tab
        e.preventDefault();

        let newCard = ulid();
        action.start();
        let factID = ulid();
        await mutate("createCard", {
          memberEntity,
          entityID: newCard,
          title: "",
        });
        await create(
          newCard,
          {
            addToEnd: true,
            parentID: room,
            positionKey: "eav",
            attribute: "desktop/contains",
          },
          rep,
          mutate,
          factID
        );
        await mutate("assertFact", {
          entity: newCard,
          attribute: "card/image",
          value: { type: "file", id: data.data.id, filetype: "image" },
          positions: {},
        });
        if (roomType.value === "canvas") {
          let siblingPositions = await rep.query(async (tx) => {
            let siblings = await scanIndex(tx).eav(room, "desktop/contains");

            return Promise.all(
              siblings.map(async (c) =>
                scanIndex(tx).eav(c.id, "card/position-in")
              )
            );
          });

          let siblingsSortedByPosition = siblingPositions.sort(
            (a, b) => (a?.value.y || 0) - (b?.value.y || 0)
          );

          let lastSiblingPosition =
            siblingsSortedByPosition[siblingsSortedByPosition.length - 2]?.value
              .y;

          await mutate("assertFact", {
            entity: factID,
            attribute: "card/position-in",
            value: {
              type: "position",
              x: 64,
              y: lastSiblingPosition ? lastSiblingPosition + 124 : 32,
              rotation: 0,
              size: "small",
            },
            positions: {},
          });

          let roomElement = document.getElementById("room-wrapper");
          roomElement?.scrollTo({
            top: lastSiblingPosition ? lastSiblingPosition : 0,
            behavior: "smooth",
          });
        }
        open({ entityID: newCard, focus: "title" });

        action.end();
      }}
      ref={ref}
      className="no-scrollbar flex h-full w-[336px] flex-col items-stretch overflow-x-hidden overflow-y-scroll p-3 pt-0 text-sm sm:p-4 sm:pt-0"
    >
      <RoomHeader
        totalCount={total}
        filteredCount={cardsFiltered.length}
        entityID={room}
        reactions={reactions}
        filters={filters}
        setFilters={setFilters}
      />

      {/* per-room wrappers + components */}
      {room ? (
        roomType?.value === "collection" ? (
          <div className="flex grow flex-col gap-2 pb-3">
            <CardCollection
              cards={cardsFiltered}
              entityID={room}
              attribute="desktop/contains"
              openOnAdd
            />
          </div>
        ) : (
          <div className="relative flex flex-col">
            <Desktop entityID={room} />
            <div className="desktopBackground absolute h-full w-full grow" />
          </div>
        )
      ) : null}

      <AddCardButton
        total={total}
        firstCard={cardsFiltered[0]?.value.value}
        roomEntity={room}
        getViewHeight={() =>
          ref.current ? ref?.current.clientHeight + ref.current.scrollTop : 0
        }
      />
    </div>
  );
};

const AddCardButton = (props: {
  firstCard?: string;
  total: number;
  roomEntity: string;
  getViewHeight: () => number | undefined;
}) => {
  let { open } = useCardViewer();
  let firstCardTitle = db.useEntity(props?.firstCard || null, "card/title");
  let roomType = db.useEntity(props.roomEntity, "room/type");
  const { attributes, listeners, setNodeRef } = useDraggableCard({
    id: "new-card",
    type: "new-card",
    size: roomType?.value === "canvas" ? "small" : "big",
  });
  let { mutate, memberEntity, authorized, rep } = useMutations();
  if (!authorized || !roomType || roomType?.value === "chat") return null;
  let showHelp =
    props.total === 0 ||
    (props.total === 1 &&
      firstCardTitle?.value === "HYPERLINK README 📖✨📖 click here! 🌱");

  return (
    <div className="absolute bottom-0 left-[136px] z-[2] -mb-[1px] flex h-8 w-16 items-center justify-center rounded-t-full border border-b-0 border-grey-80 bg-background text-center">
      {showHelp && (
        <div className="absolute bottom-10 flex flex-col place-items-center">
          <div className=" w-max rounded-md bg-accent-blue px-2 py-1 text-center text-sm font-bold text-white">
            Drag to add a Card!
          </div>
          <svg
            className="-mt-0.5 "
            width="16"
            height="8"
            viewBox="0 0 24 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 12.5L0 0.5H24L12 12.5Z" fill="#0000FF" />
          </svg>
        </div>
      )}

      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={async () => {
          if (!roomType || !memberEntity || !authorized || !rep) return;
          if (roomType.value === "chat") return;
          let newEntity = ulid();
          await mutate("createCard", {
            entityID: newEntity,
            title: "",
            memberEntity,
          });

          if (roomType.value === "collection") {
            let siblings = (
              await rep.query((tx) => {
                return scanIndex(tx).eav(props.roomEntity, "desktop/contains");
              })
            ).sort(sortByPosition("eav"));
            let newIndex = siblings.length - 1;
            let position = generateKeyBetween(
              siblings[newIndex]?.positions.eav || null,
              siblings[newIndex + 1]?.positions.eav || null
            );

            await mutate("addCardToSection", {
              factID: ulid(),
              cardEntity: newEntity,
              parent: props.roomEntity,
              section: "desktop/contains",
              positions: {
                eav: position,
              },
            });

            let roomElement = document.getElementById("room-wrapper");
            roomElement?.scrollTo({
              top: roomElement.scrollHeight,
              behavior: "smooth",
            });
          }
          if (roomType.value === "canvas") {
            let siblingPositions = await rep.query(async (tx) => {
              let siblings = await scanIndex(tx).eav(
                props.roomEntity,
                "desktop/contains"
              );

              return Promise.all(
                siblings.map(async (c) =>
                  scanIndex(tx).eav(c.id, "card/position-in")
                )
              );
            });

            let siblingsSortedByPosition = siblingPositions.sort(
              (a, b) => (a?.value.y || 0) - (b?.value.y || 0)
            );

            let lastSiblingPosition =
              siblingsSortedByPosition[siblingsSortedByPosition.length - 1]
                ?.value.y;

            mutate("addCardToDesktop", {
              entity: newEntity,
              factID: ulid(),
              desktop: props.roomEntity,
              position: {
                rotation: 0,
                size: "small",
                x: 64,
                y: lastSiblingPosition ? lastSiblingPosition + 124 : 32,
              },
            });
            let roomElement = document.getElementById("room-wrapper");
            roomElement?.scrollTo({
              top: lastSiblingPosition ? lastSiblingPosition : 0,
              behavior: "smooth",
            });
          }

          open({ entityID: newEntity, focus: "title" });

          //open the card
        }}
        className={`${
          props.total === 0 ? "text-accent-blue" : "text-grey-55"
        } relative outline-none hover:text-accent-blue`}
      >
        <div className="-mt-2 ml-1">
          <CardAddLarge />
        </div>
      </button>
    </div>
  );
};

export function RoomHeader(props: {
  filteredCount: number;
  totalCount: number;
  entityID: string;
  reactions: string[];
  filters: Filters;
  setFilters: (f: (old: Filters) => Filters) => void;
}) {
  let [descriptionOpen, setDescriptionOpen] = useState(false);
  let [scrolledTop, setScrolledTop] = useState(true);
  let [nameEditing, setNameEditing] = useState(false);

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
        className="roomHeader sticky top-0 z-20 bg-background pt-3"
        ref={titleRef}
      >
        <div className="roomTitle flex justify-between">
          <button
            className={` text-left text-lg font-bold text-grey-35 `}
            onClick={(e) => {
              if (authorized) {
                setNameEditing(true);
                return;
              }
            }}
          >
            {authorized && nameEditing ? (
              <SingleTextSection
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setNameEditing(false);
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.setSelectionRange(
                    0,
                    e.currentTarget.value.length
                  );
                }}
                entityID={props.entityID}
                section="room/name"
                focused
                onBlur={() => setNameEditing(false)}
                className={`grow border-none bg-inherit p-0 font-normal italic text-inherit`}
              />
            ) : (
              roomName?.value
            )}
          </button>

          {authorized && (
            <div className="roomOptionsWrapper mt-[1px] flex items-start gap-1 text-grey-35">
              {scrolledTop ? (
                <div className="w-4" />
              ) : (
                <button
                  className="mt-1 "
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
              <RoomOptions entityID={props.entityID} />
            </div>
          )}
        </div>
      </div>

      <div
        className={`roomDescriptionAndFilter z-10 bg-background ${
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
          filteredCount={props.filteredCount}
          totalCount={props.totalCount}
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
  filteredCount: number;
  totalCount: number;
}) => {
  let roomDescription = db.useEntity(props.entityID, "room/description");
  let roomType = db.useEntity(props.entityID, "room/type");
  let currentCollectionType = db.useEntity(props.entityID, "collection/type");
  let [filtersOpen, setFiltersOpen] = useState(false);
  let { authorized } = useMutations();

  let [descriptionEditing, setDescriptionEditing] = useState(false);

  return (
    <>
      <div id="roomDescription" className="flex flex-col gap-1 ">
        {roomDescription?.value && (
          <button
            className={`flex flex-col pt-1 text-left text-base text-grey-35`}
            onClick={(e) => {
              if (authorized) {
                setDescriptionEditing(true);
                return;
              }
            }}
          >
            {authorized && descriptionEditing ? (
              <SingleTextSection
                onFocus={(e) => {
                  e.currentTarget.setSelectionRange(
                    0,
                    e.currentTarget.value.length
                  );
                }}
                entityID={props.entityID}
                section="room/description"
                focused
                onBlur={() => setDescriptionEditing(false)}
                className={`grow border-none bg-inherit p-0 font-normal italic text-inherit`}
              />
            ) : (
              <Textarea value={roomDescription?.value} />
            )}
          </button>
        )}

        {roomType?.value === "collection" ? (
          <div className="flex flex-col gap-1 pt-1">
            <div className="roomCollectionOptions flex justify-between text-sm">
              <div className="roomCountAndFilter flex gap-2">
                <div className="roomCardCount flex items-center gap-1 text-sm font-bold text-grey-35">
                  <RoomCollection className="shrink-0" />
                  {props.totalCount === props.filteredCount
                    ? props.totalCount
                    : `${props.filteredCount}/${props.totalCount}`}{" "}
                </div>
                <div className="my-0.5 border-l-[1px] text-grey-55" />
                <button
                  className={`text-grey-55 ${
                    props.filters.length === 0 ? " " : "font-bold "
                  }`}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  filters({props.filters.length})
                </button>
              </div>
              <CollectionType
                collectionType={currentCollectionType?.value}
                entityID={props.entityID}
              />
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
        className={` flex rounded-md border border-transparent px-[2px] py-[4px] align-top hover:border-accent-blue hover:text-accent-blue`}
      >
        <MoreOptionsTiny />
      </button>
      <EditRoomModal
        open={isRoomEditOpen}
        onClose={() => setIsRoomEditOpen(false)}
        room={props.entityID}
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
    `p-0.5 text-grey-55 ${
      type === typeName
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
