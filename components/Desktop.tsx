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
import { SmallCard } from "./SmallCard";
import { useMemo } from "react";

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
      ]}
      onDragEnd={async ({ active, delta, over }) => {
        if (!homeEntity[0]) return;
        if (!over || over.id === active.id)
          return await mutate("updatePositionInDesktop", {
            factID: active.id as string,
            parent: homeEntity[0].entity,
            dx: delta.x,
            dy: delta.y,
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
        style={{ border: "1px solid", height: "1000px", width: "400px" }}
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: props.relationshipID,
      data: { entityID: props.entityID },
    });
  let { setNodeRef: draggableRef, isOver } = useDroppable({
    id: props.relationshipID,
    data: { entityID: props.entityID },
  });
  let refs = useCombinedRefs(setNodeRef, draggableRef);

  const style = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <div
      style={{
        zIndex: isDragging ? 10 : undefined,
        transform: style,
        top: (position?.value.y || 0) + "px",
        left: (position?.value.x || 0) + "px",
      }}
      ref={refs}
      className="touch-none absolute w-min"
    >
      <SmallCard
        href=""
        resizable
        listeners={listeners}
        attributes={attributes}
        draggable
        {...props}
      />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}
