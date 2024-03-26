import { db, scanIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { CardPreview, PlaceholderNewCard } from "components/CardPreview";
import { useCardPreviewData } from "hooks/CardPreviewData";
import { useDraggableCard } from "components/DragContext";
import { ulid } from "src/ulid";
import { useCardViewer } from "components/CardViewerContext";
import { useCurrentOpenCard, useRoom } from "hooks/useUIState";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { Fact } from "data/Facts";
import { SidebarSearchInput } from "app/(app)/@sidebar/SidebarSearch";

export const useSearch = () => {
  let [input, setInput] = useState("");
  let cards = db.useAttribute("card/title");
  let results = cards.filter(
    (c) =>
      c.value &&
      input.length > 0 &&
      (!input ||
        c.value.toLocaleLowerCase().includes(input.toLocaleLowerCase()))
  );
  let exactMatch = input && !!cards.find((c) => c.value === input);
  return { input, setInput, results, exactMatch };
};

export const SpaceSearch = ({
  results,
  exactMatch,
  input,
  selectedItemIndex,
  setInput,
  setSelectedItemIndex,
}: {
  results: Fact<"card/title">[];
  selectedItemIndex: number;
  exactMatch: boolean | string;
  input: string;
  setInput: (input: string) => void;
  setSelectedItemIndex: (index: number | ((n: number) => number)) => void;
}) => {
  let { open: openCard } = useCardViewer();
  let { authorized, memberEntity, mutate, rep } = useMutations();
  let currentOpenCard = useCurrentOpenCard();
  let room = useRoom();
  let roomType = db.useEntity(room, "room/type");
  return (
    <SidebarSearchInput
      onEnter={async (e) => {
        let entityID: string;
        console.log("we gettin here?");
        if (!authorized || !memberEntity) return;
        if (selectedItemIndex === results.length && !exactMatch) {
          entityID = ulid();
          await mutate("createCard", {
            entityID,
            title: input,
            memberEntity,
          });
        } else {
          entityID = results[selectedItemIndex].entity;
        }
        if (e.ctrlKey || e.metaKey) {
          if (e.shiftKey && currentOpenCard) {
            if (!rep) return;
            let siblings = (
              await rep.query((tx) => {
                return scanIndex(tx).eav(room, "deck/contains");
              })
            ).sort(sortByPosition("eav"));
            let newIndex = siblings.length - 1;
            let position = generateKeyBetween(
              siblings[newIndex]?.positions.eav || null,
              siblings[newIndex + 1]?.positions.eav || null
            );

            await mutate("addCardToSection", {
              factID: ulid(),
              cardEntity: entityID,
              parent: currentOpenCard,
              section: "deck/contains",
              positions: {
                eav: position,
              },
            });
            (e.currentTarget as HTMLElement)?.blur();
            return;
          }
          if (!roomType || !rep) return;
          if (roomType.value === "chat") return;
          if (roomType.value === "collection") {
            let siblings = (
              await rep.query((tx) => {
                return scanIndex(tx).eav(room, "desktop/contains");
              })
            ).sort(sortByPosition("eav"));
            let newIndex = siblings.length - 1;
            let position = generateKeyBetween(
              siblings[newIndex]?.positions.eav || null,
              siblings[newIndex + 1]?.positions.eav || null
            );

            await mutate("addCardToSection", {
              factID: ulid(),
              cardEntity: entityID,
              parent: room,
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
            let positions = await rep.query(async (tx) => {
              return await Promise.all(
                (
                  await scanIndex(tx).eav(room, "desktop/contains")
                ).map(async (c) => scanIndex(tx).eav(c.id, "card/position-in"))
              );
            });
            let lowestCard = positions.reduce((acc, val) => {
              return val && val.value.y > acc ? val.value.y : acc;
            }, 0);
            await mutate("addCardToDesktop", {
              entity: entityID,
              factID: ulid(),
              desktop: room,
              position: {
                rotation: 0,
                size: "small",
                x: 64,
                y: lowestCard === 0 ? 32 : lowestCard + 124,
              },
            });
            let roomElement = document.getElementById("room-wrapper");
            roomElement?.scrollTo({
              top: lowestCard,
              behavior: "smooth",
            });
          }
        } else {
          openCard({ entityID, focus: "content" });
        }
      }}
      selectedItemIndex={selectedItemIndex}
      setSelectectedItemIndex={setSelectedItemIndex}
      resultsLength={results.length}
      value={input}
      onChange={(value) => {
        setInput(value);
      }}
      placeholder="search space (ctrl/⌘ K)"
    />
  );
};

const NewCard = (props: { title: string; onClick: () => void }) => {
  let { authorized, mutate, memberEntity } = useMutations();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: "new-search-card" + props.title,
    type: "new-search-card",
    size: "big",
    title: props.title,
  });
  let { open } = useCardViewer();
  if (!authorized) return null;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={async () => {
        if (!authorized || !memberEntity) return;
        let entityID = ulid();
        await mutate("createCard", {
          entityID,
          title: props.title,
          memberEntity,
        });
        props.onClick();
        open({ entityID, focus: "content" });
      }}
      className={`touch-none ${isDragging ? `opacity-60` : ""}`}
    >
      <PlaceholderNewCard title={props.title} />
    </div>
  );
};

const UnicodeKeyboardKey = (props: { children: React.ReactNode }) => {
  return (
    <code className="flex h-4 w-fit min-w-[16px] justify-center rounded-md border border-grey-80 bg-background text-center font-sans text-[10px] not-italic text-grey-55">
      {props.children}
    </code>
  );
};

export const CardSearchResult = (props: {
  onClick?: () => void;
  entityID: string;
}) => {
  let data = useCardPreviewData(props.entityID);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: props.entityID,
    data: data,
    type: "search-card",
    size: "big",
    entityID: props.entityID,
    onDragEnd: (over) => {
      if (over.type === "search") return;
      props.onClick?.();
    },
  });

  return (
    <div ref={setNodeRef} className={`${isDragging ? ` opacity-60` : ""}`}>
      <CardPreview
        onClick={props.onClick}
        data={data}
        entityID={props.entityID}
        size="big"
        dragHandleProps={{ listeners, attributes }}
        hideContent
      />
    </div>
  );
};
