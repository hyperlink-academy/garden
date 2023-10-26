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
  CardAdd,
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
import { useAuth } from "hooks/useAuth";
import { getAndUploadFile } from "src/getAndUploadFile";
import { AddExistingCard, create } from "components/CardStack";
import { useDraggable } from "@dnd-kit/core";
import { useDraggableCard } from "./DragContext";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";

export const Room = (props: { entityID: string }) => {
  let roomType = db.useEntity(props.entityID, "room/type");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  let { reactions, filters, setFilters, cardsFiltered, total } =
    useFilteredCards(props.entityID, "desktop/contains");

  let { authToken } = useAuth();
  let { authorized, mutate, rep, action, memberEntity } = useMutations();
  let spaceID = useSpaceID();

  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;
  if (props.entityID === "unreads") return <UnreadsRoom />;
  if (roomType?.value === "chat")
    return (
      <div className="flex h-full w-[336px]">
        <DiscussionRoom entityID={props.entityID} isRoom />
      </div>
    );

  return (
    <div
      id="room-wrapper"
      onPaste={async (e) => {
        if (!authToken || !spaceID || !roomType || !rep || !memberEntity)
          return;
        if (roomType.value === "chat") return;
        let data = await getAndUploadFile(
          e.clipboardData.items,
          authToken,
          spaceID
        );
        if (!data.success) return;
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
            parentID: props.entityID,
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
          await mutate("assertFact", {
            entity: factID,
            attribute: "card/position-in",
            value: {
              type: "position",
              x: 0,
              y: 0,
              rotation: 1 - Math.random() * 2,
              size: "small",
            },
            positions: {},
          });
        }
        action.end();
      }}
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
        ) : (
          <div className="relative flex flex-col">
            <Desktop entityID={props.entityID} />
            <div className="desktopBackground absolute h-full w-full grow" />
          </div>
        )
      ) : null}

      <AddCardButton
        roomEntity={props.entityID}
        getViewHeight={() =>
          ref.current ? ref?.current.clientHeight + ref.current.scrollTop : 0
        }
      />
    </div>
  );
};

const AddCardButton = (props: {
  roomEntity: string;
  getViewHeight: () => number | undefined;
}) => {
  let roomType = db.useEntity(props.roomEntity, "room/type");
  const { attributes, listeners, setNodeRef } = useDraggableCard({
    id: "new-card",
    type: "new-card",
  });
  let { mutate, memberEntity, authorized, rep } = useMutations();
  if (!authorized || !roomType || roomType?.value === "chat") return null;
  return (
    <div className="absolute bottom-0 left-[136px] z-[2] -mb-1 flex h-8 w-16 items-center justify-center rounded-t-full border border-b-0 border-grey-80 bg-background text-center">
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
          }
          if (roomType.value === "canvas") {
            let viewHeight = props.getViewHeight() || 128;
            mutate("addCardToDesktop", {
              entity: newEntity,
              factID: ulid(),
              desktop: props.roomEntity,
              position: {
                rotation: 1 - Math.random() * 2,
                size: "small",
                size: "small",
                x: 64,
                y: viewHeight - 256,
              },
            });
          }
        }}
        className="outline-none hover:text-accent-blue"
      >
        <div className="-mt-4">
          <svg
            width="40"
            height="40"
            viewBox="0 0 59 49"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="6.5"
              y="25.5"
              width="38"
              height="23"
              rx="2"
              fill="white"
              stroke="#E6E6E6"
            />
            <rect
              x="4.5"
              y="17.5"
              width="44"
              height="27"
              rx="2"
              fill="white"
              stroke="#E6E6E6"
            />
            <rect
              x="0.5"
              y="5.57422"
              width="52.7448"
              height="33.8959"
              rx="2.5"
              fill="white"
              stroke="#CCCCCC"
            />
            <circle cx="51.0182" cy="7.44226" r="6.09656" fill="#FFFAF0" />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M51.0186 14.8848C55.1289 14.8848 58.4609 11.5527 58.4609 7.44238C58.4609 3.33207 55.1289 0 51.0186 0C46.9082 0 43.5762 3.33207 43.5762 7.44238C43.5762 11.5527 46.9082 14.8848 51.0186 14.8848ZM51.0161 2.08852C51.5684 2.08852 52.0161 2.53624 52.0161 3.08852V6.44274H55.3731C55.9254 6.44274 56.3731 6.89046 56.3731 7.44274C56.3731 7.99503 55.9254 8.44274 55.3731 8.44274H52.0161V11.796C52.0161 12.3483 51.5684 12.796 51.0161 12.796C50.4638 12.796 50.0161 12.3483 50.0161 11.796V8.44274H46.6656C46.1133 8.44274 45.6656 7.99503 45.6656 7.44274C45.6656 6.89046 46.1133 6.44274 46.6656 6.44274H50.0161V3.08852C50.0161 2.53624 50.4638 2.08852 51.0161 2.08852Z"
              fill="#8C8C8C"
            />
          </svg>
        </div>
      </button>
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
            className={`mb-1 text-left text-lg font-bold text-grey-35 `}
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
            <div className="roomOptionsWrapper mt-[4px] flex items-start gap-1">
              {scrolledTop ? (
                <div className="w-4" />
              ) : (
                <button
                  className="mt-1"
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
                className={`${
                  props.filters.length === 0
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
