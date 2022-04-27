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
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { updatePositions } from "src/position_helpers";
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
            [active.id, currentIndex < index ? index : index - 1],
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
