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
import { AddSmall } from "components/Icons";
import { useRef, useState } from "react";
import { CardPreview } from "./CardPreview";
import { pointerWithinOrRectIntersection } from "src/customCollisionDetection";
import { RoomListPreview } from "./SpaceLayout/Sidebar/RoomListLayout";
import { animated, useSpring } from "@react-spring/web";

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
    activationConstraint: props.activationConstraints,
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: props.activationConstraints,
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  let previouslyOver = useRef<DroppableData | null>(null);
  return (
    <DndContext
      collisionDetection={pointerWithinOrRectIntersection}
      sensors={sensors}
      onDragStart={({ active }) => {
        let activeData = active?.data.current as DraggableData;
        setActiveCard(activeData);
      }}
      onDragOver={({ over }) => {
        let overData = (over?.data.current as DroppableData) || null;
        if (
          active &&
          previouslyOver.current &&
          previouslyOver.current.id !== overData?.id
        ) {
          previouslyOver.current.onDragExit?.(active);
        }
        if (active && overData) overData.onDragEnter?.(active);
        setOver(overData);
        previouslyOver.current = overData;
      }}
      onDragCancel={({ active }) => {
        let activeData = active?.data.current as DraggableData;
        if (previouslyOver.current)
          previouslyOver.current.onDragExit?.(activeData);
      }}
      onDragEnd={async ({ over, active: activeData }) => {
        let overData = over?.data.current as DroppableData;
        if (active)
          overData?.onDragEnd?.(active, activeData.rect.current.translated);
        setActiveCard(null);
        setOver(null);
      }}
      onDragMove={async ({ over, active: activeData }) => {
        let overData = over?.data.current as DroppableData;
        if (active)
          overData?.onDragMove?.(active, activeData.rect.current.translated);
      }}
    >
      {props.children}

      <DragOverlay dropAnimation={null} adjustScale={false} >
        {active?.entityID ? (
          <AnimatedPickup >
            {active.type === "card" ? (
              <div
                className={``}
                style={{
                  transform: `rotate(${!active.rotation
                    ? 0
                    : (
                      Math.floor(active.rotation / (Math.PI / 24)) *
                      (Math.PI / 24)
                    ).toFixed(2)
                    }rad)`,
                }}
              >
                <CardPreview
                  outerControls
                  entityID={active.entityID}
                  size={active.size}
                  hideContent={active.hideContent}
                />
                {over?.type === "linkCard" && (
                  <span className="absolute -top-2 -left-2 text-accent-blue">
                    <AddSmall />
                  </span>
                )}
              </div>
            ) : (
              <RoomListPreview entityID={active.entityID} />
            )}
          </AnimatedPickup>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const AnimatedPickup = (props: { children: React.ReactNode }) => {
  let spring = useSpring({ from: { scale: 1 }, to: { scale: 1.02 } })
  return <animated.div className="relative text-sm drop-shadow" style={spring}>{props.children}</animated.div>
}

export type DraggableData = {
  id: string;
  entityID: string;
  disabled?: boolean;
} & (
    | {
      type: "card";
      parent: string;
      hideContent: boolean;
      rotation?: number;
      size: "big" | "small";
    }
    | { type: "room" }
  );

export type DroppableData = {
  id: string;
  entityID: string;
  type: "card" | "room" | "dropzone" | "linkCard";
  onDragEnter?: (data: DraggableData) => void;
  onDragExit?: (data: DraggableData) => void;
  onDragEnd?: (data: DraggableData, rect: ClientRect | null) => void;
  onDragMove?: (data: DraggableData, rect: ClientRect | null) => void;
};

export const useDraggableCard = (data: DraggableData) => {
  let draggable = useDraggable({ id: data.id, data, disabled: data.disabled });
  let isOverSomethingElse =
    draggable.isDragging &&
    draggable.over &&
    draggable.over?.data.current?.entityID !== data.entityID;
  return { ...draggable, isOverSomethingElse };
};

export const useDroppableZone = (data: DroppableData) => {
  let [over, setOver] = useState<DraggableData | null>(null);
  let droppable = useDroppable({
    id: data.id,
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
  return { ...droppable, over };
};
