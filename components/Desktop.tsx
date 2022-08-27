import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
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
        if (!over)
          return await mutate("updatePositionInDesktop", {
            entityID: active.id as string,
            parent: homeEntity[0].entity,
            dx: delta.x,
            dy: delta.y,
          });
        if (over.id === active.id) return;

        await mutate("addToOrCreateDeck", {
          child: active.id as string,
          parent: over.id as string,
          desktop: homeEntity[0].entity,
        });
      }}
    >
      <div>
        {cards?.map((card) => (
          <DraggableCard
            key={card.id}
            entityID={card.value.value}
            parent={homeEntity[0]?.entity}
          />
        ))}
      </div>
    </DndContext>
  );
};

const DraggableCard = (props: { entityID: string; parent: string }) => {
  let position = useIndex
    .eav(props.entityID, "card/position-in")
    ?.find((f) => f.value.value === props.parent);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: props.entityID,
    });
  let { setNodeRef: draggableRef, isOver } = useDroppable({
    id: props.entityID,
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
        top: (position?.positions.y || 0) + "px",
        left: (position?.positions.x || 0) + "px",
      }}
      ref={refs}
      className="touch-none relative w-min"
    >
      <SmallCard
        href=""
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
