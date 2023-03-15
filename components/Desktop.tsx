import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { useContext, useMemo, useState } from "react";
import { CardPreview } from "./CardPreview";
import { ulid } from "src/ulid";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { useSubscribe } from "replicache-react";
import { useCardViewer } from "./CardViewerContext";
import { useDraggableCard, useDroppableZone } from "./DragContext";

const GRID_SIZE = 16;
const snap = (x: number) => Math.ceil(x / GRID_SIZE) * GRID_SIZE;

export const Desktop = (props: { entityID: string }) => {
  let cards = useIndex.eav(props.entityID, "desktop/contains");
  let height = useHeight(props.entityID) + 500;
  let { mutate, action, authorized } = useMutations();
  let rep = useContext(ReplicacheContext);
  let [draggingHeight, setDraggingHeight] = useState(0);
  let [createCard, setCreateCard] = useState<null | { x: number; y: number }>(
    null
  );
  let { setNodeRef, rect: droppableRect } = useDroppableZone({
    type: "dropzone",
    id: props.entityID,
    entityID: props.entityID,
    onDragMove: (_data, rect) => {
      if (!rect || !droppableRect.current) return;
      let newHeight = rect.top - droppableRect.current.top;
      if (newHeight > height)
        setDraggingHeight((oldValue) => {
          let newValue = newHeight + 200;
          return newValue > oldValue ? newValue : oldValue;
        });
    },
    onDragEnd: async (data, rect) => {
      if (!rect || !droppableRect.current || !rep || data.type !== "card")
        return;
      let newPosition = {
        y: snap(rect.top - droppableRect.current?.top),
        x: snap(rect.left - droppableRect.current.left),
      };
      if (data.parent !== props.entityID) {
        await mutate("retractFact", { id: data.id });
        await mutate("addCardToDesktop", {
          factID: ulid(),
          entity: data.entityID,
          desktop: props.entityID,
          position: {
            ...newPosition,
            rotation: 0,
            size:
              data.size === "small"
                ? "small"
                : data.hideContent
                ? "small"
                : "big",
          },
        });
      } else {
        let position = await rep.rep.query((tx) => {
          return scanIndex(tx).eav(data.id, "card/position-in");
        });
        if (!position) return;
        await mutate("updatePositionInDesktop", {
          factID: data.id,
          parent: props.entityID,
          dx: newPosition.x - position?.value.x,
          dy: newPosition.y - position.value.y,
          da: 0,
        });
      }
    },
  });

  return (
    <>
      <AddCard
        position={createCard}
        onClose={() => setCreateCard(null)}
        desktopEntity={props.entityID}
      />
      {/* Handles Double CLick to Create */}
      <div
        ref={setNodeRef}
        onClick={(e) => {
          if (!authorized) return;
          if (e.currentTarget !== e.target) return;
          let parentRect = e.currentTarget.getBoundingClientRect();
          if (e.ctrlKey || e.metaKey) {
            action.start();
            mutate("addCardToDesktop", {
              entity: ulid(),
              factID: ulid(),
              desktop: props.entityID,
              position: {
                rotation: 0,
                size: "small",
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
    </>
  );
};

let useHeight = (entity: string) => {
  let rep = useContext(ReplicacheContext);
  return useSubscribe(
    rep?.rep,
    async (tx) => {
      let cards = await scanIndex(tx).eav(entity, "desktop/contains");
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: props.relationshipID,
    entityID: props.entityID,
    parent: props.parent,
    type: "card",
    size: position?.value.size || "small",
    hideContent: false,
  });
  let refs = useCombinedRefs(setNodeRef);
  let { close } = useCardViewer();

  let y = position?.value.y || 0;
  let x = position?.value.x || 0;
  return (
    <>
      {/* This handles the canvas position and card size*/}
      {!isDragging && (
        <div
          style={{
            zIndex: isDragging
              ? 100000
              : Math.floor(y / 10) * 100 + Math.floor(x / 10),
            top: snap(y) + "px",
            left: snap(x) + "px",
            width: position?.value.size === "big" ? "288px" : "fit-content",
          }}
          ref={refs}
          className="absolute touch-none"
        >
          {/* This handles the rotation */}
          <div
            className={``}
            style={{
              transform: `rotate(${
                !position
                  ? 0
                  : (
                      Math.floor(position.value.rotation / (Math.PI / 24)) *
                      (Math.PI / 24)
                    ).toFixed(2)
              }rad)`,
            }}
          >
            {/* This is the actual card and its buttons. It also handles size */}
            <CardPreview
              outerControls
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
                close({ entityID: props.entityID });
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
              {...props}
            />
          </div>
        </div>
      )}
    </>
  );
};

const AddCard = (props: {
  onClose: () => void;
  desktopEntity: string;
  position: null | { x: number; y: number };
}) => {
  let items = useAllItems(!!props.position);
  let name = useIndex.eav(props.desktopEntity, "member/name");
  let { open } = useCardViewer();
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
          open({ entityID: entity });
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
