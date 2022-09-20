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
import { useEffect, useMemo, useRef, useState } from "react";
import { CardPreview } from "./CardPreview";
import { customCollisionDetection } from "src/customCollisionDetection";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { ulid } from "src/ulid";
import { DownArrow, UpArrow } from "./Icons";
import { useRouter } from "next/router";

export const Desktop = () => {
  let homeEntity = useIndex.aev("home");
  let cards = useIndex.eav(homeEntity[0]?.entity || null, "deck/contains");
  let height = useIndex.eav(homeEntity[0]?.entity || null, "canvas/height");
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
        onClick={(e) => {
          if (e.currentTarget !== e.target) return;
          if (e.detail === 2) {
            let newCard = ulid();
            let parentRect = e.currentTarget.getBoundingClientRect();
            mutate("addCardToDesktop", {
              entity: newCard,
              factID: ulid(),
              desktop: homeEntity[0]?.entity,
              position: {
                rotation: 0,
                size: "small",
                x: e.clientX - parentRect.left,
                y: e.clientY - parentRect.top,
              },
            });
          }
        }}
        style={{
          zIndex: 1,
          maxWidth: "600px",
          height: `${height?.value || 800}px`,
        }}
        className="relative border-r border-grey-90 text-sm"
      >
        {cards?.map((card) => (
          <DraggableCard
            key={card.id}
            relationshipID={card.id}
            entityID={card.value.value}
            parent={homeEntity[0]?.entity}
          />
        ))}
        <ResizeCanvas canvasEntity={homeEntity[0]?.entity} />
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
  let { query: q } = useRouter();
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
          style={{
            transform: `rotate(${
              !position
                ? 0
                : (
                    Math.floor(position.value.rotation / (Math.PI / 24)) *
                    (Math.PI / 24)
                  ).toFixed(2)
            }rad)`,
          }}
        >
          <CardPreview
            href={`/s/${q.studio}/s/${q.space}/c/${props.entityID}`}
            onRotateDrag={(da) => {
              mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                parent: props.parent,
                dx: 0,
                dy: 0,
                da,
              });
            }}
            dragHandleProps={{ listeners, attributes }}
            size={position?.value.size || "small"}
            onResize={async (size) => {
              return await mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                size: size,
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

const ResizeCanvas = (props: { canvasEntity: string }) => {
  let height = useIndex.eav(props.canvasEntity, "canvas/height");
  let { authorized, mutate } = useMutations();
  let [hoveringLess, setHoveringLess] = useState(false);
  useEffect(() => setHoveringLess(false), [(height?.value || 0) > 800]);
  return (
    <div
      style={{ bottom: 16 }}
      className="absolute flex flex-row gap-4 w-full justify-between px-4"
    >
      {authorized && (
        <button
          className="flex flex-row text-grey-80 items-center hover:text-accent-blue"
          onClick={() => {
            mutate("assertFact", {
              entity: props.canvasEntity,
              attribute: "canvas/height",
              positions: {},
              value: (height?.value || 800) + 400,
            });
          }}
        >
          <DownArrow className="-mx-0.5" height="18" width="18" />
          <DownArrow className="-mx-0.5" height="18" width="18" />
          <DownArrow className="-ml-0.5 mr-1" height="18" width="18" />
          more
          <DownArrow className="ml-1 -mr-0.5" height="18" width="18" />
          <DownArrow className="-mx-0.5" height="18" width="18" />
          <DownArrow className="-mx-0.5" height="18" width="18" />
        </button>
      )}
      {height && height?.value > 800 && authorized && (
        <button
          onMouseEnter={() => setHoveringLess(true)}
          onMouseLeave={() => setHoveringLess(false)}
          className="flex flex-row text-grey-80 items-center hover:text-accent-red"
          onClick={() => {
            mutate("assertFact", {
              entity: props.canvasEntity,
              attribute: "canvas/height",
              positions: {},
              value: (height?.value || 800) - 400,
            });
          }}
        >
          <UpArrow className="ml-1 -mx-0.5" height={"18"} width={"18"} />
          <UpArrow className="-mx-0.5" height={"18"} width={"18"} />
          <UpArrow className="-ml-0.5 mr-1" height={"18"} width={"18"} />
          less
          <UpArrow className="-mr-0.5" height={"18"} width={"18"} />
          <UpArrow className="-mx-0.5" height={"18"} width={"18"} />
          <UpArrow className="-mx-0.5" height={"18"} width={"18"} />
        </button>
      )}
      {hoveringLess && (
        <div
          style={{
            top: "-368px",
            left: "-16px",
            zIndex: "-1",
            opacity: "0.1",
            backgroundImage:
              "repeating-linear-gradient(-45deg,transparent, transparent 5px, black 5px,black 8px) ",
          }}
          className="absolute w-full h-[400px]"
        />
      )}
    </div>
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
