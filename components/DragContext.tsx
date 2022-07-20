import {
  Active,
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { createPortal } from "react-dom";
import { animated, useTransition } from "@react-spring/web";
import { updatePositions } from "src/position_helpers";
import { SmallCard } from "./SmallCard";

export const SmallCardDragContext: React.FC = (props) => {
  let [activeCard, setActiveCard] = useState<Active | null>(null);
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let { mutate } = useMutations();
  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragStart={({ active }) => {
        setActiveCard(active);
      }}
      onDragEnd={async (data) => {
        let { over, active } = data;
        setActiveCard(null);
        if (over) {
          if (!active) return;
          if (over.id === "delete") {
            mutate("removeCardFromSection", { id: active.id as string });
            return;
          }
          let index = over.data.current?.index;
          let currentIndex: number | undefined = active.data.current?.index;
          let parent: string | undefined = over.data.current?.parent;
          let section: keyof ReferenceAttributes | undefined =
            over.data.current?.section;
          let positionKey: string | undefined = over.data.current?.positionKey;
          let siblings: Fact<keyof ReferenceAttributes>[] | undefined =
            over.data.current?.siblings;

          if (
            index === undefined ||
            currentIndex === undefined ||
            !siblings ||
            !positionKey ||
            !parent ||
            !section
          )
            return;
          let newPositions = updatePositions(positionKey, siblings, [
            [active.id as string, currentIndex < index ? index : index - 1],
          ]);
          await mutate("updatePositions", {
            positionKey: positionKey,
            newPositions,
          });
        }
      }}
    >
      {props.children}
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <SmallCard
            entityID={activeCard.data.current?.entityID}
            href=""
            draggable={true}
          />
        ) : null}
      </DragOverlay>
      {<DeleteZone display={!!activeCard} />}
    </DndContext>
  );
};

const DeleteZone = (props: { display: boolean }) => {
  let { setNodeRef, isOver } = useDroppable({ id: "delete" });
  let transition = useTransition(props.display, {
    config: { mass: 0.1, tension: 500, friction: 25 },
    from: { width: 0 },
    enter: { width: 32 },
    update: { width: isOver ? 64 : 32 },
    leave: { width: 0 },
    delay: 100,
    reverse: props.display,
  });
  return transition(
    (a, show) =>
      show &&
      createPortal(
        <animated.div
          className="rounded-md"
          style={{
            writingMode: "vertical-lr",
            position: "fixed",
            height: "calc(100vh - 256px)",
            right: 0,
            zIndex: 50,
            width: a.width.to((w) => `${w}px`),
            top: "96px",
            background: "lightgrey",
            textAlign: "center",
            verticalAlign: "bottom",
            overflow: "hidden",
          }}
        >
          <div ref={setNodeRef}>Drag here to delete</div>
        </animated.div>,
        document.body
      )
  );
};
