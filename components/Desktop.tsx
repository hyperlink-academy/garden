import {
  ReplicacheContext,
  scanIndex,
  db,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import {
  MutableRefObject,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CardPreview } from "./CardPreview";
import { ulid } from "src/ulid";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { useSubscribe } from "replicache-react";
import { useCardViewer } from "./CardViewerContext";
import { useDraggableCard, useDroppableZone } from "./DragContext";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { useAuth } from "hooks/useAuth";
import { getAndUploadFile } from "src/getAndUploadFile";
import { useCardPreviewData } from "hooks/CardPreviewData";
import { useRemoveCardFromRoomHistory } from "hooks/useUIState";

const GRID_SIZE = 8;
const snap = (x: number) => Math.round(x / GRID_SIZE) * GRID_SIZE;

export const Desktop = (props: { entityID: string }) => {
  let { open } = useCardViewer();

  let cards = db.useEntity(props.entityID, "desktop/contains");
  let height = useHeight(props.entityID) + 500;
  let { authToken } = useAuth();
  let { mutate, action, authorized, memberEntity } = useMutations();
  let rep = useContext(ReplicacheContext);
  let spaceID = useSpaceID();
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
      if (!rect || !droppableRect.current || !rep || data.type === "room")
        return;
      let newPosition = {
        y: Math.max(snap(rect.top - droppableRect.current?.top), 0),
        x: Math.min(
          Math.max(0, snap(rect.left - droppableRect.current.left)),
          320
        ),
      };

      switch (data.type) {
        case "new-card": {
          if (!memberEntity) return;
          let entityID = ulid();

          await mutate("addCardToDesktop", {
            factID: ulid(),
            entity: entityID,
            desktop: props.entityID,
            position: {
              ...newPosition,
              rotation: 0,
              size: "small",
            },
          });

          await mutate("createCard", {
            entityID,
            title: "",
            memberEntity,
          });
          open({ entityID: entityID, focus: "title" });
          break;
        }
        case "new-search-card": {
          if (!memberEntity) return;
          let entityID = ulid();

          await mutate("addCardToDesktop", {
            factID: ulid(),
            entity: entityID,
            desktop: props.entityID,
            position: {
              ...newPosition,
              rotation: 0,
              size: "small",
            },
          });

          await mutate("createCard", {
            entityID,
            title: data.title,
            memberEntity,
          });

          open({ entityID: entityID, focus: "title" });
          break;
        }
        case "search-card": {
          await mutate("addCardToDesktop", {
            factID: ulid(),
            entity: data.entityID,
            desktop: props.entityID,
            position: {
              ...newPosition,
              rotation: 0,
              size: "small",
            },
          });
          open({ entityID: data.entityID, focus: "title" });

          break;
        }
        case "card": {
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
                  data.position?.size === "small"
                    ? "small"
                    : data.hideContent
                    ? "small"
                    : "big",
              },
            });
          } else {
            let position =
              data.type === "card" ? data.position : { x: 0, y: 0 };
            if (!position) return;
            await mutate("updatePositionInDesktop", {
              factID: data.id,
              parent: props.entityID,
              dx: newPosition.x - position.x,
              dy: newPosition.y - position.y,
              da: 0,
            });
          }
          break;
        }
        default: {
          data satisfies never;
        }
      }
    },
  });

  return (
    <>
      <div
        ref={setNodeRef}
        onClick={async (e) => {
          if (!authorized || !memberEntity) return;
          if (e.currentTarget !== e.target) return;
          let parentRect = e.currentTarget.getBoundingClientRect();

          // Create a new card on cntl/cmd + click or double click
          if (e.ctrlKey || e.metaKey || e.detail === 2) {
            action.start();
            let entity = ulid();
            mutate("addCardToDesktop", {
              entity,
              factID: ulid(),
              desktop: props.entityID,
              position: {
                rotation: 0,
                size: "small",
                x: Math.max(e.clientX - parentRect.left - 128, 0),
                y: Math.max(e.clientY - parentRect.top - 42, 0),
              },
            });
            await mutate("createCard", {
              title: "",
              entityID: entity,
              memberEntity,
            });

            open({ entityID: entity, focus: "title" });

            action.end();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          if (!authToken || !spaceID) return;
          let parentRect = e.currentTarget.getBoundingClientRect();
          let data = await getAndUploadFile(
            e.dataTransfer.items,
            authToken,
            spaceID
          );
          if (data.length === 0) return;
          for (let i = 0; i < data.length; i++) {
            let image = data[i];
            if (image.success === false) continue;
            let entity = ulid();
            await mutate("assertFact", {
              entity,
              factID: ulid(),
              attribute: "card/image",
              value: { type: "file", id: image.data.id, filetype: "image" },
              positions: {},
            });

            await mutate("addCardToDesktop", {
              entity,
              factID: ulid(),
              desktop: props.entityID,
              position: {
                rotation: 0,
                size: "small",
                x: Math.max(e.clientX - parentRect.left - 128, 0),
                y: Math.max(e.clientY - parentRect.top - 42 + i * 128, 0),
              },
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
  let position = db.useEntity(props.relationshipID, "card/position-in");
  let { mutate, rep } = useMutations();
  let data = useCardPreviewData(props.entityID);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    data: data,
    id: props.relationshipID,
    outerControls: true,
    entityID: props.entityID,
    parent: props.parent,
    position: position?.value,
    type: "card",
    onDragStart: async () => {
      await mutate("updatePositionInDesktop", {
        factID: props.relationshipID,
        parent: props.parent,
        dx: 0,
        dy: 0,
        da: 0,
      });
    },
    hideContent: false,
  });

  let { setNodeRef: setNodeRef2 } = useDroppableZone({
    id: props.relationshipID,
    entityID: props.entityID,
    type: "desktopCard",
    onDragEnd: async (data) => {
      if (!rep) return;
      let entityID;
      switch (data.type) {
        case "room":
          return;
        case "card": {
          entityID = data.entityID;
          mutate("retractFact", { id: data.id });
          break;
        }
        case "search-card": {
          entityID = data.entityID;
          break;
        }
        case "new-card": {
          entityID = ulid();
          break;
        }
        case "new-search-card": {
          entityID = ulid();
          break;
        }
        default: {
          data satisfies never;
        }
      }

      let siblings =
        (await rep.query((tx) => {
          return scanIndex(tx).eav(props.entityID, "deck/contains");
        })) || [];

      let firstPosition = siblings.sort(sortByPosition("eav"))[0]?.positions[
        "eav"
      ];
      let position = generateKeyBetween(null, firstPosition || null);
      await mutate("addCardToSection", {
        factID: ulid(),
        cardEntity: entityID as string,
        parent: props.entityID,
        section: "deck/contains",
        positions: {
          eav: position,
        },
      });
    },
  });
  let refs = useCombinedRefs(setNodeRef, setNodeRef2);
  let removeCardFromRoomHistory = useRemoveCardFromRoomHistory();
  let onRotateDrag = useCallback(
    (da: number) => {
      mutate("updatePositionInDesktop", {
        factID: props.relationshipID,
        parent: props.parent,
        dx: 0,
        dy: 0,
        da,
      });
    },
    [props.parent, props.relationshipID, mutate]
  );
  let onDelete = useCallback(() => {
    mutate("removeCardFromDesktopOrCollection", {
      factID: props.relationshipID,
      entityID: props.entityID,
    });
    removeCardFromRoomHistory({
      cardEntity: props.entityID,
      room: props.parent,
    });
  }, [
    props.relationshipID,
    props.entityID,
    removeCardFromRoomHistory,
    mutate,
    props.parent,
  ]);
  let dragHandleProps = useMemo(
    () => ({ listeners, attributes }),
    [listeners, attributes]
  );
  let onResize = useCallback(
    (size: "big" | "small") => {
      mutate("updatePositionInDesktop", {
        factID: props.relationshipID,
        size: size,
        parent: props.parent,
        dx: 0,
        dy: 0,
        da: 0,
      });
    },
    [props.relationshipID, props.parent, mutate]
  );

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
          className="absolute"
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
              data={data}
              outerControls
              factID={props.relationshipID}
              onRotateDrag={onRotateDrag}
              onDelete={onDelete}
              dragHandleProps={dragHandleProps}
              size={position?.value.size || "small"}
              onResize={onResize}
              {...props}
            />
          </div>
        </div>
      )}
    </>
  );
};

export function useCombinedRefs<T>(
  ...refs: Array<((node: T) => void) | MutableRefObject<T>>
): (node: T) => void {
  return useMemo(
    () => (node: T) => {
      refs.forEach((ref) =>
        typeof ref === "function" ? ref(node) : (ref.current = node)
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}
