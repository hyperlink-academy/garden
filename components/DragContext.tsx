import {
  Active,
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { BaseSmallCard } from "./SmallCard";

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
          let index = over.data.current?.index;
          let currentIndex = active.data.current?.index;
          let parent = over.data.current?.parent;
          let section = over.data.current?.section;

          if (
            index === undefined ||
            currentIndex === undefined ||
            !parent ||
            !section
          )
            return;

          await mutate("moveCard", {
            factID: active.id,
            positionKey: "eav",
            parent,
            attribute: section,
            index: currentIndex < index ? index : index - 1,
          });
        }
      }}
    >
      {props.children}
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <BaseSmallCard
            entityID={activeCard.data.current?.entityID}
            href=""
            draggable={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
