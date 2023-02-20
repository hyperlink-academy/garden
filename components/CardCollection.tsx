import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useIndex, useMutations } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { ButtonTertiary } from "./Buttons";
import { CardPreview } from "./CardPreview";
import { AddAttachedCard } from "./CardStack";
import { useCardViewer } from "./CardViewerContext";
import { useCombinedRefs } from "./Desktop";
import { AddSmall } from "./Icons";

export const CardCollection = (props: { entityID: string }) => {
  let cards = (useIndex.eav(props.entityID, "desktop/contains") || []).sort(
    sortByPosition("eav")
  );
  let { open } = useCardViewer();
  return (
    <div className="min-h-screen">
      <div className="z-50 flex flex-wrap gap-x-2 gap-y-4">
        <AddAttachedCard
          onAdd={(entity) => {
            open({ entityID: entity });
          }}
          parent={props.entityID}
          positionKey="eav"
          attribute="desktop/contains"
        >
          <div className="relative mr-4 flex h-[6rem] w-[143px] items-center justify-center rounded-lg border border-dashed text-grey-35">
            <AddSmall />
          </div>
        </AddAttachedCard>
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

  let { close } = useCardViewer();

  let refs = useCombinedRefs(draggableRef);
  let { mutate } = useMutations();

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
          onDelete={() => {
            mutate("retractFact", { id: props.id });
            close({ entityID: props.entityID });
          }}
        />
      </div>
    </>
  );
};
