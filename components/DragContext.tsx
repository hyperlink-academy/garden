import {
  ClientRect,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
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
import { create, useStore } from "zustand";
import { useUIState } from "hooks/useUIState";

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
      collisionDetection={closestCorners}
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
        else await overData?.onDragCancel?.();
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
          <AnimatedPickup
            size={active.type === "new-card" ? active.size : "small"}
          >
            <CardDragPreview active={active} />
            <CardDropIndicator active={active} over={over} />
          </AnimatedPickup>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const CardDragPreview = ({ active }: { active: DraggableData }) => {
  switch (active.type) {
    case "card":
      return (
        <div
          style={{
            transform: `rotate(${(
              Math.floor((active.position?.rotation || 0) / (Math.PI / 24)) *
              (Math.PI / 24)
            ).toFixed(2)}rad)`,
          }}
        >
          <CardPreview
            data={active.data}
            outerControls={active.outerControls}
            entityID={active.entityID}
            size={active.position?.size || active.size || "small"}
            hideContent={active.hideContent}
          />
        </div>
      );
    case "search-card":
      return (
        <div>
          <CardPreview
            data={active.data}
            outerControls={false}
            entityID={active.entityID}
            size={"big"}
            hideContent
          />
        </div>
      );
    case "room":
      return <RoomListPreview entityID={active.entityID} />;
    case "new-card":
      return (
        <div>
          <div className={`${active.size === "big" ? "w-[302px]" : ""}`}>
            <CardPreview
              outerControls={false}
              entityID={""}
              size={active.size}
              data={EmptyCardData}
            />
          </div>
        </div>
      );
    case "new-search-card":
      return (
        <div className="w-full">
          <PlaceholderNewCard title={active.title} />
        </div>
      );
    default: {
      active satisfies never;
    }
  }
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
  let size = active.size || "small";

  return (
    <div
      className={`absolute -bottom-4 ${
        size === "small" ? "right-4" : "right-2"
      } flex flex-row items-center gap-2 rounded-md bg-accent-blue px-2 py-1 align-middle font-bold text-white`}
    >
      <AddTiny width={12} height={12} className="shrink-0" />
      {(active.type === "card" && (active.size === "small" || !active.size)) ||
      (active.type === "new-card" && active.size === "small") ? (
        // if the card is in a room, and is small OR is a from the new card button, use a small indicator
        <span>{"Add"}</span>
      ) : (
        <span>Place {over.type === "linkCard" ? "on Card" : "in Room"}</span>
      )}
    </div>
  );
};

const AnimatedPickup = (props: {
  children: React.ReactNode;
  size: "small" | "big";
}) => {
  let spring = useSpring({ from: { scale: 1 }, to: { scale: 1.02 } });

  return (
    <animated.div
      className={`relative  ${
        props.size === "small" ? "min-w-[152px]" : "min-w-[302px]"
      } text-sm drop-shadow`}
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
  | { type: "new-card"; size: "big" | "small" }
  | {
      data: CardPreviewData;
      type: "search-card";
      size: "big";
      entityID: string;
    }
  | { type: "new-search-card"; size: "big"; title: string }
);

export type DroppableData = {
  id: string;
  disabled?: boolean;
  entityID: string;

  onDragCancel?: () => void | Promise<void>;
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

type OverState = {
  state: { over: DraggableData; id: string; updatedAt: number } | null;
};
let useOverStore = create(() => ({ state: null } as OverState));
let setState = (
  s: OverState | ((state: OverState) => OverState),
  reason: string
) => {
  console.log(reason);
  useOverStore.setState(s);
};

export const useDroppableZone = (data: DroppableData) => {
  let over = useOverStore(({ state: s }) =>
    s ? (s.id === data.id ? s.over : null) : null
  );
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
        let now = Date.now();
        setTimeout(() => {
          setState((state) => {
            let s = state?.state;
            if (s?.id === data.id && s.updatedAt < now) return { state: null };
            return state;
          }, "exit");
        }, 100);
      },
      onDragCancel: () => {
        data.onDragCancel?.();
        setState({ state: null }, "cancel");
      },
      onDragEnter: (d: DraggableData) => {
        data.onDragEnter?.(d);
        setState(
          { state: { over: d, id: data.id, updatedAt: Date.now() } },
          "enter"
        );
      },
      onDragEnd: (d: DraggableData, rect: ClientRect | null) => {
        console.log("yo");
        data.onDragEnd?.(d, rect);
        setState({ state: null }, "end");
      },
    },
  });
  return {
    ...droppable,
    active: droppable.active as { data: { current: DraggableData } } | null,
    over,
  };
};
