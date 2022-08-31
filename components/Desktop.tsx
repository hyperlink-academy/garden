import { useIndex, useMutations } from "hooks/useReplicache";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useRef, useState } from "react";
import { CardPreview } from "./CardPreview";
import { customCollisionDetection } from "src/customCollisionDetection";
import { restrictToParentElement } from "@dnd-kit/modifiers";

export const Desktop = () => {
  let homeEntity = useIndex.aev("home");
  let cards = useIndex.eav(homeEntity[0]?.entity || null, "deck/contains");
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let { mutate } = useMutations();

  return (
    <DndContext
      sensors={sensors}
      modifiers={[
        ({ transform }) => ({
          ...transform,
          x: Math.ceil(transform.x / 30) * 30,
          y: Math.ceil(transform.y / 30) * 30,
        }),
        restrictToParentElement,
      ]}
      collisionDetection={customCollisionDetection}
      onDragEnd={async (props) => {
        let { active, delta, over, collisions } = props;
        let overCollision = collisions?.find(
          (c) => c.data?.droppableContainer.id === over?.id
        );
        if (!homeEntity[0]) return;
        if (
          !over ||
          overCollision?.data?.targetRatio < 0.95 ||
          over.id === active.id
        )
          return await mutate("updatePositionInDesktop", {
            factID: active.id as string,
            parent: homeEntity[0].entity,
            dx: delta.x,
            dy: delta.y,
            da: 0,
          });

        await mutate("addToOrCreateDeck", {
          droppedCardPositionFact: active.id as string,
          droppedCardEntity: active.data.current?.entityID,
          targetCardPositionFact: over.id as string,
          targetCardEntity: over.data.current?.entityID,
          desktop: homeEntity[0].entity,
        });
      }}
    >
      <div
        onScroll={(e) => {
          e.currentTarget.scrollLeft = 0;
        }}
        style={{
          border: "1px solid",
          paddingBottom: "64px",
          height: "800px",
          overflowY: "scroll",
          width: "400px",
          maxWidth: "400px",
        }}
        className="relative"
      >
        {cards?.map((card) => (
          <DraggableCard
            key={card.id}
            relationshipID={card.id}
            entityID={card.value.value}
            parent={homeEntity[0]?.entity}
          />
        ))}
      </div>
    </DndContext>
  );
};

const DraggableCard = (props: {
  entityID: string;
  parent: string;
  relationshipID: string;
}) => {
  let position = useIndex.eav(props.relationshipID, "card/position-in");
  let { mutate } = useMutations();
  let ref = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: props.relationshipID,
      data: { entityID: props.entityID },
    });
  let { setNodeRef: draggableRef } = useDroppable({
    id: props.relationshipID,
    disabled: isDragging,
    data: { entityID: props.entityID },
  });
  let refs = useCombinedRefs(setNodeRef, draggableRef);

  const style = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : "";

  let y = position?.value.y || 0;
  let x = position?.value.x || 0;
  return (
    <>
      <div
        style={{
          zIndex: isDragging
            ? 100000
            : Math.floor(y / 10) * 100 + Math.floor(x / 10),
          transform: style,
          top: y + "px",
          left: x + "px",
        }}
        ref={refs}
        className="touch-none absolute w-min"
      >
        <div
          ref={ref}
          style={{ rotate: `${position?.value.rotation || 0}rad` }}
        >
          <CardPreview
            href=""
            onRotateDrag={({ initial, xy, memo }) => {
              if (!ref.current) return;
              let rect = ref.current.getBoundingClientRect();
              memo = memo || 0;

              let originX = rect.x + rect.width / 2;
              let originY = rect.y + rect.height / 2;

              let angle = find_angle(
                { x: initial[0], y: initial[1] },
                { x: originX, y: originY },
                { x: xy[0], y: xy[1] }
              );
              mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                parent: props.parent,
                dx: 0,
                dy: 0,
                da: angle - memo,
              });
              return angle;
            }}
            dragHandleProps={{ listeners, attributes }}
            size={position?.value.size || "small"}
            onResize={async () => {
              return await mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                size: position?.value.size === "big" ? "small" : "big",
                parent: props.parent,
                dx: 0,
                dy: 0,
                da: 0,
              });
            }}
            {...props}
          />
        </div>
      </div>
    </>
  );
};

export function useCombinedRefs<T>(
  ...refs: ((node: T) => void)[]
): (node: T) => void {
  return useMemo(
    () => (node: T) => {
      refs.forEach((ref) => ref(node));
    },
    refs
  );
}

type P = { x: number; y: number };
function find_angle(P2: P, P1: P, P3: P) {
  if (P1.x === P3.x && P1.y === P3.y) return 0;
  let a = Math.atan2(P3.y - P1.y, P3.x - P1.x);
  let b = Math.atan2(P2.y - P1.y, P2.x - P1.x);
  return a - b;
}
