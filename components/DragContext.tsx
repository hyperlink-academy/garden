import {
  Active,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
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

export const SmallCardDragContext: React.FC = (props) => {
  let [activeCard, setActiveCard] = useState<Active | null>(null);
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
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
      }}
      onDragEnd={async (data) => {
        let { over, active } = data;
        if (!over || !rep?.rep) return;
        let overData = over.data.current as StackData & { entityID: string };
        let activeData = active.data.current as StackData & {
          entityID: string;
        };
        console.log(overData);
        let siblings = (
          await rep.rep.query((tx) => {
            return scanIndex(tx).eav(overData.parent, overData.attribute);
          })
        ).sort(sortByPosition(overData.positionKey));

        let currentIndex = siblings.findIndex(
          (f) => f.value.value === activeData.entityID
        );
        let newIndex = siblings.findIndex(
          (f) => f.value.value === overData.entityID
        );
        let newPositions = updatePositions(overData.positionKey, siblings, [
          [
            siblings[currentIndex].id,
            currentIndex < newIndex ? newIndex : newIndex - 1,
          ],
        ]);
        console.log(siblings);
        console.log(newPositions);
        mutate("updatePositions", {
          positionKey: overData.positionKey,
          newPositions,
        });
      }}
    >
      {props.children}
      <DragOverlay>
        {activeCard && (
          <div className="touch-none pointer-events-none">
            <CardPreview
              href=""
              entityID={activeCard.data.current?.entityID}
              size={"big"}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
