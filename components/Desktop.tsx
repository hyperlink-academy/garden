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
import { useEffect, useMemo, useRef, useState } from "react";
import { CardPreview } from "./CardPreview";
import { customCollisionDetection } from "src/customCollisionDetection";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { ulid } from "src/ulid";
import { DownArrow, UpArrow } from "./Icons";
import { useRouter } from "next/router";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";

const GRID_SIZE = 16;
const snap = (x: number) => Math.ceil(x / GRID_SIZE) * GRID_SIZE;

export const Desktop = () => {
  let homeEntity = useIndex.aev("home");
  let cards = useIndex.eav(homeEntity[0]?.entity || null, "deck/contains");
  let height = useIndex.eav(homeEntity[0]?.entity || null, "canvas/height");
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let { mutate } = useMutations();
  let [createCard, setCreateCard] = useState<null | { x: number; y: number }>(
    null
  );

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
      onDragEnd={async (props) => {
        let { active, delta, over, collisions } = props;
        let overCollision = collisions?.find(
          (c) => c.data?.droppableContainer.id === over?.id
        );
        if (!homeEntity[0]) return;
        if (
          !over ||
          overCollision?.data?.targetRatio < 0.95 ||
          over.id === active.id
        )
          return await mutate("updatePositionInDesktop", {
            factID: active.id as string,
            parent: homeEntity[0].entity,
            dx: delta.x,
            dy: delta.y,
            da: 0,
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
      <AddCard
        position={createCard}
        onClose={() => setCreateCard(null)}
        desktopEntity={homeEntity[0]?.entity}
      />
      <div
        onClick={(e) => {
          if (e.currentTarget !== e.target) return;
          if (e.detail === 2) {
            let parentRect = e.currentTarget.getBoundingClientRect();
            setCreateCard({
              x: e.clientX - parentRect.left,
              y: e.clientY - parentRect.top,
            });
            let newCard = ulid();
          }
        }}
        style={{
          zIndex: 1,
          height: `${height?.value || 800}px`,
        }}
        className="relative text-sm"
      >
        {cards?.map((card) => (
          <DraggableCard
            key={card.id}
            relationshipID={card.id}
            entityID={card.value.value}
            parent={homeEntity[0]?.entity}
          />
        ))}
        <ResizeCanvas canvasEntity={homeEntity[0]?.entity} />
        {/* <HelpToast helpText={`double click/tap to create new`} /> */}
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
  let { mutate } = useMutations();
  let { query: q } = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: props.relationshipID,
      data: { entityID: props.entityID },
    });
  let { setNodeRef: draggableRef } = useDroppable({
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
        className="touch-none absolute"
      >
        {/* This handles the rotation */}
        <div
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
            factID={props.relationshipID}
            href={`/s/${q.studio}/s/${q.space}/c/${props.entityID}`}
            onRotateDrag={(da) => {
              mutate("updatePositionInDesktop", {
                factID: props.relationshipID,
                parent: props.parent,
                dx: 0,
                dy: 0,
                da,
              });
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
    </>
  );
};

const ResizeCanvas = (props: { canvasEntity: string }) => {
  let height = useIndex.eav(props.canvasEntity, "canvas/height");
  let { authorized, mutate } = useMutations();
  let [hoveringLess, setHoveringLess] = useState(false);
  useEffect(() => setHoveringLess(false), [(height?.value || 0) > 800]);
  return (
    <div
      style={{ bottom: 16 }}
      className="absolute flex flex-row gap-4 w-full justify-between px-4"
    >
      {authorized && (
        <button
          className="flex flex-row z-[9999999999] text-grey-80 items-center hover:text-accent-blue"
          onClick={() => {
            mutate("assertFact", {
              entity: props.canvasEntity,
              attribute: "canvas/height",
              positions: {},
              value: (height?.value || 800) + 400,
            });
          }}
        >
          <DownArrow className="-mx-0.5" height="18" width="18" />
          <DownArrow className="-mx-0.5" height="18" width="18" />
          <DownArrow className="-ml-0.5 mr-1" height="18" width="18" />
          more
          <DownArrow className="ml-1 -mr-0.5" height="18" width="18" />
          <DownArrow className="-mx-0.5" height="18" width="18" />
          <DownArrow className="-mx-0.5" height="18" width="18" />
        </button>
      )}
      {height && height?.value > 800 && authorized && (
        <button
          onMouseEnter={() => setHoveringLess(true)}
          onMouseLeave={() => setHoveringLess(false)}
          className="flex flex-row z-[9999999999] text-grey-80 items-center hover:text-accent-red"
          onClick={() => {
            mutate("assertFact", {
              entity: props.canvasEntity,
              attribute: "canvas/height",
              positions: {},
              value: (height?.value || 800) - 400,
            });
          }}
        >
          <UpArrow className="ml-1 -mx-0.5" height={"18"} width={"18"} />
          <UpArrow className="-mx-0.5" height={"18"} width={"18"} />
          <UpArrow className="-ml-0.5 mr-1" height={"18"} width={"18"} />
          less
          <UpArrow className="-mr-0.5" height={"18"} width={"18"} />
          <UpArrow className="-mx-0.5" height={"18"} width={"18"} />
          <UpArrow className="-mx-0.5" height={"18"} width={"18"} />
        </button>
      )}
      {hoveringLess && (
        <div
          style={{
            top: "-368px",
            left: "-16px",
            zIndex: "-1",
            opacity: "0.1",
            backgroundImage:
              "repeating-linear-gradient(-45deg,transparent, transparent 5px, black 5px, black 8px) ",
          }}
          className="absolute w-full h-[400px]"
        />
      )}
    </div>
  );
};

const AddCard = (props: {
  onClose: () => void;
  desktopEntity: string;
  position: null | { x: number; y: number };
}) => {
  let items = useAllItems(!!props.position);
  let { authorized, mutate } = useMutations();
  return (
    <FindOrCreate
      items={items}
      open={!!props.position}
      allowBlank={true}
      onClose={() => props.onClose()}
      onSelect={async (d) => {
        if (!props.position) return;
        let entity;
        if (d.type === "create") {
          entity = ulid();
          if (d.name) {
            await mutate("createCard", {
              entityID: entity,
              title: d.name,
            });
          }
        } else {
          entity = d.entity;
        }

        mutate("addCardToDesktop", {
          entity,
          desktop: props.desktopEntity,
          position: {
            rotation: 0,
            size: "small",
            x: props.position.x,
            y: props.position.y,
          },
        });
      }}
      selected={[]}
    />
  );
};

export const HelpToast = (props: { helpText: string }) => {
  return (
    <div className="flex fixed bottom-20 w-[320px] justify-center">
      <div className="rounded-full text-grey-80 italic text-center px-2 py-1">
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
