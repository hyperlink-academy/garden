import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Fact } from "data/Facts";
import { useIndex, useMutations } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";
import { CardPreview } from "./CardPreview";
import { AddAttachedCard } from "./CardStack";
import { useCardViewer } from "./CardViewerContext";
import { useCombinedRefs } from "./Desktop";
import { AddSmall } from "./Icons";

export const CardCollection = (props: { entityID: string }) => {
  let cards = (useIndex.eav(props.entityID, "desktop/contains") || []).sort(
    sortByPosition("eav")
  );
  let collectionType = useIndex.eav(props.entityID, "collection/type");
  return (
    <div className="min-h-screen">
      <CollectionHeader entityID={props.entityID} />
      <SortableContext
        items={cards?.map((c) => c.id) || []}
        strategy={
          collectionType?.value !== "grid"
            ? verticalListSortingStrategy
            : rectSortingStrategy
        }
      >
        {collectionType?.value === "list" ? (
          <CollectionList
            entityID={props.entityID}
            cards={cards}
            size="small"
          />
        ) : collectionType?.value === "cardpreview" ? (
          <CollectionList entityID={props.entityID} cards={cards} size="big" />
        ) : (
          <CollectionGrid entityID={props.entityID} cards={cards} />
        )}
      </SortableContext>
    </div>
  );
};

const CollectionList = (props: {
  size: "small" | "big";
  entityID: string;
  cards: Fact<"desktop/contains">[];
}) => {
  let { open } = useCardViewer();
  return (
    <div className="z-50 flex flex-col gap-y-2">
      <AddAttachedCard
        onAdd={(entity) => {
          open({ entityID: entity });
        }}
        parent={props.entityID}
        positionKey="eav"
        attribute="desktop/contains"
      >
        <div
          className={`relative mr-4 flex ${
            props.size === "big" ? "h-24" : "h-10"
          } w-full items-center justify-center rounded-lg border border-dashed text-grey-35`}
        >
          <AddSmall />
        </div>
      </AddAttachedCard>
      {props.cards?.map((card) => (
        <DraggableCard
          size="big"
          hideContent={props.size === "small"}
          parent={props.entityID}
          entityID={card.value.value}
          key={card.id}
          id={card.id}
        />
      ))}
    </div>
  );
};

const CollectionGrid = (props: {
  entityID: string;
  cards: Fact<"desktop/contains">[];
}) => {
  let { open } = useCardViewer();
  return (
    <div className="z-50 flex flex-wrap gap-x-2 gap-y-4">
      <AddAttachedCard
        onAdd={(entity) => {
          open({ entityID: entity });
        }}
        parent={props.entityID}
        positionKey="eav"
        attribute="desktop/contains"
      >
        <div className="relative mr-2 flex h-[6rem] w-[154px] items-center justify-center rounded-lg border border-dashed text-grey-35">
          <AddSmall />
        </div>
      </AddAttachedCard>
      {props.cards?.map((card) => (
        <DraggableCard
          size="small"
          parent={props.entityID}
          entityID={card.value.value}
          key={card.id}
          id={card.id}
        />
      ))}
    </div>
  );
};

const CollectionHeader = (props: { entityID: string }) => {
  let collectionType = useIndex.eav(props.entityID, "collection/type");
  let { mutate, authorized } = useMutations();
  if (!authorized) return null;
  let type = collectionType?.value || "grid";

  const onClick = (value: Fact<"collection/type">["value"]) => () => {
    mutate("assertFact", {
      entity: props.entityID,
      attribute: "collection/type",
      value: value,
      positions: {},
    });
  };
  const className = (typeName: Fact<"collection/type">["value"]) =>
    `px-1 ${type === typeName ? "rounded-md border" : ""}`;

  return (
    <div className="flex flex-row gap-2 pb-2">
      <button className={className("grid")} onClick={onClick("grid")}>
        grid
      </button>
      <button className={className("list")} onClick={onClick("list")}>
        list
      </button>
      <button
        className={className("cardpreview")}
        onClick={onClick("cardpreview")}
      >
        preview
      </button>
    </div>
  );
};

const DraggableCard = (props: {
  entityID: string;
  size: "big" | "small";
  hideContent?: boolean;
  id: string;
  parent: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transition,
    transform,
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
      : "rotate(0)"; // needed for 'fixed' position reactions relative to card rather than page
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
          size={props.size}
          dragHandleProps={{ listeners, attributes }}
          hideContent={props.hideContent}
          onDelete={() => {
            mutate("retractFact", { id: props.id });
            close({ entityID: props.entityID });
          }}
        />
      </div>
    </>
  );
};
