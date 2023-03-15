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
import { useRef, useState } from "react";
import { CardPreview } from "./CardPreview";
import { RoomListPreview } from "./SpaceLayout/Sidebar/SharedRoomList";
import { pointerWithinOrRectIntersection } from "src/customCollisionDetection";

export const SmallCardDragContext = (props: {
  children: React.ReactNode;
  activationConstraints?:
    | { delay: number; tolerance: number }
    | { distance: number };
  noDeleteZone?: boolean;
}) => {
  let [active, setActiveCard] = useState<DraggableData | null>(null);
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
      }}
      onDragMove={async ({ over, active: activeData }) => {
        let overData = over?.data.current as DroppableData;
        if (active)
          overData?.onDragMove?.(active, activeData.rect.current.translated);
      }}
    >
      {props.children}

      <DragOverlay dropAnimation={null}>
        {active?.entityID ? (
          <div className="relative">
            {active.type === "card" ? (
              <CardPreview
                entityID={active.entityID}
                size={active.size}
                hideContent={active.hideContent}
              />
            ) : (
              <RoomListPreview entityID={active.entityID} />
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export type DraggableData = {
  id: string;
  entityID: string;
} & (
  | {
      type: "card";
      parent: string;
      hideContent: boolean;
      size: "big" | "small";
    }
  | { type: "room" }
);

export type DroppableData = {
  id: string;
  entityID: string;
  type: "card" | "room" | "dropzone";
  onDragEnter?: (data: DraggableData) => void;
  onDragExit?: (data: DraggableData) => void;
  onDragEnd?: (data: DraggableData, rect: ClientRect | null) => void;
  onDragMove?: (data: DraggableData, rect: ClientRect | null) => void;
};

export const useDraggableCard = (data: DraggableData) => {
  let draggable = useDraggable({ id: data.id, data });
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
