import {
  Active,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ReplicacheContext,
  scanIndex,
  useMutations,
} from "hooks/useReplicache";
import { useContext, useState } from "react";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { CardPreview } from "./CardPreview";
import { cardStackCollisionDetection } from "src/customCollisionDetection";
import { StackData } from "./CardStack";
import { animated, useTransition } from "@react-spring/web";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { useAtom, atom } from "jotai";

let draggingOverDeleteAtom = atom(false);
export const SmallCardDragContext: React.FC = (props) => {
  let [activeCard, setActiveCard] = useState<Active | null>(null);
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let [, setDraggingOverDelete] = useAtom(draggingOverDeleteAtom);

  let { mutate } = useMutations();
  let rep = useContext(ReplicacheContext);
  return (
    <DndContext
      collisionDetection={cardStackCollisionDetection}
      sensors={sensors}
      modifiers={[
        (args) => {
          let { transform } = args;
          return {
            ...transform,
          };
        },
      ]}
      onDragStart={({ active }) => {
        setActiveCard(active);
        setDraggingOverDelete(false);
      }}
      onDragOver={({ over }) => {
        if (over?.id === "delete") setDraggingOverDelete(true);
        else setDraggingOverDelete(false);
      }}
      onDragEnd={async (data) => {
        let { over, active } = data;
        setActiveCard(null);
        if (!over || !rep?.rep) return;
        if (!active.data.current) return;
        let overData = over.data.current as Data;
        let activeData = active.data.current as Data;
        if (over.id === "delete") {
          mutate("retractFact", { id: activeData.factID });
          return;
        }
        let siblings = (
          await rep.rep.query((tx) => {
            if (overData.backlink)
              return scanIndex(tx).vae(overData.parent, overData.attribute);
            return scanIndex(tx).eav(overData.parent, overData.attribute);
          })
        ).sort(sortByPosition(overData.positionKey));

        console.log(siblings);
        let currentIndex = siblings.findIndex(
          (f) =>
            (overData.backlink ? f.entity : f.value.value) ===
            activeData.entityID
        );
        let newIndex = siblings.findIndex(
          (f) =>
            (overData.backlink ? f.entity : f.value.value) === overData.entityID
        );
        let newPositions = updatePositions(overData.positionKey, siblings, [
          [
            siblings[currentIndex].id,
            currentIndex < newIndex ? newIndex : newIndex - 1,
          ],
        ]);
        console.log(newPositions);
        mutate("updatePositions", {
          positionKey: overData.positionKey,
          newPositions,
        });
      }}
    >
      {props.children}
      <DragOverlayCard entityID={activeCard?.data.current?.entityID} />
      <DeleteZone display={!!activeCard} />
    </DndContext>
  );
};

const DragOverlayCard = (props: { entityID?: string }) => {
  let [draggingOverDelete] = useAtom(draggingOverDeleteAtom);
  return (
    <DragOverlay dropAnimation={draggingOverDelete ? null : undefined}>
      {props.entityID && (
        <div className="touch-none pointer-events-none">
          <CardPreview href="" entityID={props.entityID} size={"big"} />
        </div>
      )}
    </DragOverlay>
  );
};

type Data = StackData & {
  entityID: string;
  factID: string;
};
export const useSortableCard = (c: { id: string; data: Data }) =>
  useSortable(c);

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
