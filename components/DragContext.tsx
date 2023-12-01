import {
  ClientRect,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AddSmall, AddTiny } from "components/Icons";
import { useRef, useState } from "react";
import { CardPreview, PlaceholderNewCard } from "./CardPreview";
import { pointerWithinOrRectIntersection } from "src/customCollisionDetection";
import { RoomListPreview } from "./SpaceLayout/Sidebar/RoomListLayout";
import { animated, useSpring } from "@react-spring/web";
import { CardPreviewData, EmptyCardData } from "hooks/CardPreviewData";
import { Fact } from "data/Facts";

export const SmallCardDragContext = (props: {
  children: React.ReactNode;
  activationConstraints?:
    | { delay: number; tolerance: number }
    | { distance: number };
  noDeleteZone?: boolean;
}) => {
  let [active, setActiveCard] = useState<DraggableData | null>(null);
  let [over, setOver] = useState<DroppableData | null>(null);
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 264, tolerance: 4 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  let previouslyOver = useRef<DroppableData | null>(null);
  return (
    <DndContext
      collisionDetection={pointerWithinOrRectIntersection}
      sensors={sensors}
      onDragStart={({ active }) => {
        let activeData = active?.data.current as DraggableData;
        activeData.onDragStart?.(activeData);
        setActiveCard(activeData);
      }}
      onDragOver={async ({ over }) => {
        let overData = (over?.data.current as DroppableData) || null;
        if (
          active &&
          previouslyOver.current &&
          previouslyOver.current.id !== overData?.id
        ) {
          await previouslyOver.current.onDragExit?.(active);
        }
        if (active && overData) await overData.onDragEnter?.(active);
        setOver(overData);
        previouslyOver.current = overData;
      }}
      onDragCancel={async ({ active }) => {
        let activeData = active?.data.current as DraggableData;
        if (previouslyOver.current)
          await previouslyOver.current.onDragExit?.(activeData);
      }}
      onDragEnd={async ({ over, active: activeData }) => {
        let overData = over?.data.current as DroppableData;
        if (active)
          await overData?.onDragEnd?.(
            active,
            activeData.rect.current.translated
          );
        active?.onDragEnd?.(overData);
        setActiveCard(null);
        setOver(null);
      }}
      onDragMove={async ({ over, active: activeData }) => {
        let overData = over?.data.current as DroppableData;
        if (active)
          await overData?.onDragMove?.(
            active,
            activeData.rect.current.translated
          );
      }}
    >
      {props.children}

      <DragOverlay dropAnimation={null} adjustScale={false}>
        {active ? (
          <AnimatedPickup>
            {active.type === "card" || active.type === "search-card" ? (
              /* if the dragged object is a normal card, show the card and maintain size and rotation; if its a card from search, show a big card */
              <div
                style={{
                  transform: `rotate(${
                    active.type === "search-card" || !active.position?.rotation
                      ? 0
                      : (
                          Math.floor(
                            active.position?.rotation / (Math.PI / 24)
                          ) *
                          (Math.PI / 24)
                        ).toFixed(2)
                  }rad)`,
                }}
              >
                <CardPreview
                  data={active.data}
                  outerControls={
                    active.type === "search-card" ? false : active.outerControls
                  }
                  entityID={active.entityID}
                  size={
                    active.type === "search-card"
                      ? "big"
                      : active.position?.size || active.size || "small"
                  }
                  hideContent={
                    active.type === "search-card" ? true : active.hideContent
                  }
                />
              </div>
            ) : active.type === "room" ? (
              // if its a room, show a room
              <RoomListPreview entityID={active.entityID} />
            ) : active.type === "new-card" ? (
              // if its a new card from the add card button, show a small new card
              <div style={{ transform: "rotate(0rad)" }}>
                <CardPreview
                  outerControls
                  entityID={""}
                  size="small"
                  data={EmptyCardData}
                />
              </div>
            ) : active.type === "new-search-card" ? (
              // if its a new card from the search, show a big card
              <div className="w-full">
                <PlaceholderNewCard title={active.title} />
              </div>
            ) : null}

            {/* depending on what the card is being dragged over, add an indicator to the card */}
            <CardDropIndicator active={active} over={over} />
          </AnimatedPickup>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const CardDropIndicator = ({
  active,
  over,
}: {
  active: DraggableData;
  over: DroppableData | null;
}) => {
  if (!over) return null;
  if (active.type === "room") return null;
  if (over.type === "room" && over.roomType === "chat") return null;
  if (over?.type === "search" || over?.type === "trigger") return null;
  console.log(over.type, over.entityID);
  if (active.type === "card" && active.parent === over?.entityID) return null;

  return (
    <div className="absolute -bottom-4 right-2 flex flex-row items-center gap-2 rounded-md bg-accent-blue px-2 py-1 align-middle font-bold text-white">
      <AddTiny width={12} height={12} className="shrink-0" />{" "}
      {(active.type === "card" && (active.size === "small" || !active.size)) ||
      active.type === "new-card" ? (
        // if the card is in a room, and is small OR is a from the new card button, use a small indicator
        <span>{"Add"}</span>
      ) : (
        <span>Place {over.type === "linkCard" ? "on Card" : "in Room"}</span>
      )}
    </div>
  );
};

const AnimatedPickup = (props: { children: React.ReactNode }) => {
  let spring = useSpring({ from: { scale: 1 }, to: { scale: 1.02 } });

  return (
    <animated.div
      className={`relative  min-w-[152px] text-sm drop-shadow`}
      style={spring}
    >
      {props.children}
    </animated.div>
  );
};

export type DraggableData = {
  id: string;
  disabled?: boolean;
  onDragStart?: (data: DraggableData) => void | Promise<void>;
  onDragEnd?: (over: DroppableData) => void | Promise<void>;
} & (
  | {
      type: "card";

      entityID: string;
      position?: Fact<"card/position-in">["value"];
      size?: "big" | "small";
      outerControls?: boolean;
      parent: string;
      hideContent: boolean;
      data: CardPreviewData;
    }
  | {
      type: "room";
      entityID: string;
    }
  | { type: "new-card" }
  | { data: CardPreviewData; type: "search-card"; entityID: string }
  | { type: "new-search-card"; title: string }
);

export type DroppableData = {
  id: string;
  disabled?: boolean;
  entityID: string;
  onDragEnter?: (data: DraggableData) => void | Promise<void>;
  onDragExit?: (data: DraggableData) => void | Promise<void>;
  onDragEnd?: (
    data: DraggableData,
    rect: ClientRect | null
  ) => void | Promise<void>;
  onDragMove?: (
    data: DraggableData,
    rect: ClientRect | null
  ) => void | Promise<void>;
} & (
  | {
      type: "room";
      roomType?: Fact<"room/type">["value"];
    }
  | { type: "card" | "dropzone" | "linkCard" | "trigger" | "search" }
);

export const useDraggableCard = (data: DraggableData) => {
  let draggable = useDraggable({ id: data.id, data, disabled: data.disabled });
  let isOverSomethingElse =
    draggable.isDragging &&
    draggable.over &&
    draggable.over?.data.current?.id !== data.id;
  return { ...draggable, isOverSomethingElse };
};

export const useDroppableZone = (data: DroppableData) => {
  let [over, setOver] = useState<DraggableData | null>(null);
  let droppable = useDroppable({
    id: data.id,
    disabled: data.disabled,
    resizeObserverConfig: {
      updateMeasurementsFor: [],
      timeout: 50,
    },
    data: {
      ...data,
      onDragExit: (d: DraggableData) => {
        data.onDragExit?.(d);
        setOver(null);
      },
      onDragEnter: (d: DraggableData) => {
        data.onDragEnter?.(d);
        setOver(d);
      },
      onDragEnd: (d: DraggableData, rect: ClientRect | null) => {
        data.onDragEnd?.(d, rect);
        setOver(null);
      },
    },
  });
  return {
    ...droppable,
    active: droppable.active as { data: { current: DraggableData } } | null,
    over,
  };
};
