import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useIndex } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { CardPreview } from "./CardPreview";
import { useCombinedRefs } from "./Desktop";

export const CardCollection = (props: { entityID: string }) => {
  let cards = (useIndex.eav(props.entityID, "desktop/contains") || []).sort(
    sortByPosition("eav")
  );
  return (
    <div className="min-h-screen">
      <div className="flex flex-wrap gap-2">
        <SortableContext items={cards?.map((c) => c.id) || []}>
          {cards?.map((card) => (
            <DraggableCard
              parent={props.entityID}
              entityID={card.value.value}
              key={card.id}
              id={card.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const DraggableCard = (props: {
  entityID: string;
  id: string;
  parent: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transition,
    transform,
    isDragging,
    isOver,
  } = useSortable({
    id: props.id,
    data: {
      positionKey: "eav",
      entityID: props.entityID,
      parent: props.parent,
      attribute: "desktop/contains",
    },
  });

  let refs = useCombinedRefs(draggableRef);

  const style =
    transform && (Math.abs(transform.x) > 0 || Math.abs(transform.y) > 0)
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : "";
  return (
    <>
      <div
        ref={refs}
        className={``}
        style={{
          transform: style,
          transition,
        }}
      >
        <CardPreview
          entityID={props.entityID}
          size="small"
          dragHandleProps={{ listeners, attributes }}
        />
      </div>
    </>
  );
};
