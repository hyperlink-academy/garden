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
import { useContext, useMemo, useState } from "react";
import { CardPreview } from "./CardPreview";
import { customCollisionDetection } from "src/customCollisionDetection";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { ulid } from "src/ulid";
import { useRouter } from "next/router";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { useSubscribe } from "replicache-react";

const GRID_SIZE = 16;
const snap = (x: number) => Math.ceil(x / GRID_SIZE) * GRID_SIZE;

export const Desktop = (props: { entityID: string }) => {
  let cards = useIndex.eav(props.entityID, "deck/contains");
  let height = useHeight(props.entityID);
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let { mutate, action } = useMutations();
  let [createCard, setCreateCard] = useState<null | { x: number; y: number }>(
    null
  );
  let [draggingHeight, setDraggingHeight] = useState(0);

  return (
    <DndContext
      sensors={sensors}
      modifiers={[
        (args) => {
          let { transform } = args;
          return {
            ...transform,
            x: snap(transform.x),
            y: snap(transform.y),
          };
        },
        restrictToParentElement,
      ]}
      collisionDetection={customCollisionDetection}
      onDragMove={({ delta, active }) => {
        let position: { y: number } = active.data.current?.position;
        if (!position) return;
        let h = height;
        if (position.y + delta.y + 200 > h)
          setDraggingHeight(position.y + delta.y + 200);
      }}
      onDragEnd={async (dragProps) => {
        let { active, delta, over, collisions } = dragProps;

        action.start();

        setDraggingHeight(0);
        let overCollision = collisions?.find(
          (c) => c.data?.droppableContainer.id === over?.id
        );
        if (!over || !overCollision || over.id === active.id) {
          await mutate("updatePositionInDesktop", {
            factID: active.id as string,
            parent: props.entityID,
            dx: delta.x,
            dy: delta.y,
            da: 0,
          });
          action.end();
          return;
        }

        await mutate("addToOrCreateDeck", {
          droppedCardPositionFact: active.id as string,
          droppedCardEntity: active.data.current?.entityID,
          targetCardEntity: over.data.current?.entityID,
          desktop: props.entityID,
        });

        action.end();
      }}
    >
      <AddCard
        position={createCard}
        onClose={() => setCreateCard(null)}
        desktopEntity={props.entityID}
      />
      {/* TO DO - CELINE: make desktopBackground fit - full bleed! */}
      <div className="overflow-y-scroll p-4">
        <div className="relative flex w-[384px] flex-col items-stretch gap-0">
          <div className="desktopBackground absolute h-full w-full" />
          <div
            onClick={(e) => {
              if (e.currentTarget !== e.target) return;
              let parentRect = e.currentTarget.getBoundingClientRect();
              if (e.ctrlKey) {
                action.start();
                mutate("addCardToDesktop", {
                  entity: ulid(),
                  factID: ulid(),
                  desktop: props.entityID,
                  position: {
                    rotation: 0,
                    size: "big",
                    x: Math.max(e.clientX - parentRect.left - 128, 0),
                    y: Math.max(e.clientY - parentRect.top - 42, 0),
                  },
                });
                action.end();
              }
              if (e.detail === 2) {
                setCreateCard({
                  x: e.clientX - parentRect.left,
                  y: e.clientY - parentRect.top,
                });
              }
            }}
            style={{
              zIndex: 1,
              height: `${draggingHeight > height ? draggingHeight : height}px`,
              position: "relative",
            }}
            className="text-sm"
          >
            {cards?.map((card) => (
              <DraggableCard
                key={card.id}
                relationshipID={card.id}
                entityID={card.value.value}
                parent={props.entityID}
              />
            ))}
          </div>
          {/* <HelpToast helpText={`double click/tap to create new`} /> */}
        </div>
      </div>
    </DndContext>
  );
};

let useHeight = (entity: string) => {
  let rep = useContext(ReplicacheContext);
  return useSubscribe(
    rep?.rep,
    async (tx) => {
      let cards = await scanIndex(tx).eav(entity, "deck/contains");
      return await cards.reduce(async (acc, card) => {
        let position = await scanIndex(tx).eav(card.id, "card/position-in");
        if (position && position.value.y + 200 > (await acc))
          return position.value.y + 200;
        return acc;
      }, Promise.resolve(800));
    },
    800,
    [entity]
  );
};

const DraggableCard = (props: {
  entityID: string;
  parent: string;
  relationshipID: string;
}) => {
  let position = useIndex.eav(props.relationshipID, "card/position-in");
  let { mutate } = useMutations();
  let { query: q } = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: props.relationshipID,
      data: { entityID: props.entityID, position: position?.value },
    });
  let { setNodeRef: draggableRef, isOver } = useDroppable({
    id: props.relationshipID,
    disabled: isDragging,
    data: { entityID: props.entityID },
  });
  let refs = useCombinedRefs(setNodeRef, draggableRef);

  const style = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : "";

  let y = position?.value.y || 0;
  let x = position?.value.x || 0;
  return (
    <>
      {/* This handles the canvas position and card size*/}
      <div
        style={{
          zIndex: isDragging
            ? 100000
            : Math.floor(y / 10) * 100 + Math.floor(x / 10),
          transform: style,
          top: snap(y) + "px",
          left: snap(x) + "px",
          width: position?.value.size === "big" ? "288px" : "fit-content",
        }}
        ref={refs}
        className="absolute touch-none"
      >
        {/* This handles the rotation */}
        <div
          className={`${isOver ? "scale-105" : ""}`}
          style={{
            transform: `rotate(${
              !position
                ? 0
                : (
                    Math.floor(position.value.rotation / (Math.PI / 24)) *
                    (Math.PI / 24)
                  ).toFixed(2)
            }rad) ${isOver ? "scale(1.05)" : ""}`,
          }}
        >
          {/* This is the actual card and its buttons. It also handles size */}
          <CardPreview
            factID={props.relationshipID}
            onRotateDrag={(da) => {
              mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                parent: props.parent,
                dx: 0,
                dy: 0,
                da,
              });
            }}
            onDelete={() => {
              mutate("retractFact", { id: props.relationshipID });
            }}
            dragHandleProps={{ listeners, attributes }}
            size={position?.value.size || "small"}
            onResize={async (size) => {
              return await mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                size: size,
                parent: props.parent,
                dx: 0,
                dy: 0,
                da: 0,
              });
            }}
            isOver={isOver}
            {...props}
          />
        </div>
      </div>
    </>
  );
};

const AddCard = (props: {
  onClose: () => void;
  desktopEntity: string;
  position: null | { x: number; y: number };
}) => {
  let items = useAllItems(!!props.position);
  let { mutate, memberEntity, action } = useMutations();
  return (
    <FindOrCreate
      items={items}
      open={!!props.position}
      allowBlank={true}
      onClose={() => props.onClose()}
      onSelect={async (cards) => {
        if (!props.position || !memberEntity) return;
        let entity;

        action.start();
        for (let d of cards) {
          if (d.type === "create") {
            entity = ulid();
            await mutate("createCard", {
              entityID: entity,
              title: d.name,
              memberEntity,
            });
          } else {
            entity = d.entity;
          }

          await mutate("addCardToDesktop", {
            entity,
            factID: ulid(),
            desktop: props.desktopEntity,
            position: {
              rotation: 0,
              size: "small",
              x: Math.max(props.position.x - 128, 0),
              y: Math.max(props.position.y - 42, 0),
            },
          });
        }

        action.end();
      }}
      selected={[]}
    />
  );
};

export const HelpToast = (props: { helpText: string }) => {
  return (
    <div className="fixed bottom-20 flex w-[320px] justify-center">
      <div className="rounded-full px-2 py-1 text-center italic text-grey-80">
        * {props.helpText} *
      </div>
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
    refs
  );
}
