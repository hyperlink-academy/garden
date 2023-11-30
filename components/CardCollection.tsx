import { Fact } from "data/Facts";
import { useCardPreviewData } from "hooks/CardPreviewData";
import { useAuth } from "hooks/useAuth";
import {
  ReplicacheContext,
  scanIndex,
  db,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { useCallback, useContext } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { getAndUploadFile } from "src/getAndUploadFile";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { ulid } from "src/ulid";
import { CardPreview, PlaceholderNewCard } from "./CardPreview";
import { CardAdder } from "./CardStack";
import { useCombinedRefs } from "./Desktop";
import {
  DraggableData,
  useDraggableCard,
  useDroppableZone,
} from "./DragContext";
import { useRemoveCardFromRoomHistory, useUIState } from "hooks/useUIState";
import { useDebouncedValue } from "hooks/useDebouncedValue";
import { useCardViewer } from "./CardViewerContext";

export const CardCollection = (props: {
  entityID: string;
  editable?: boolean;
  attribute: "desktop/contains" | "deck/contains";
  cards: Fact<"desktop/contains" | "deck/contains">[];
  openOnAdd?: boolean;
}) => {
  let collectionType = db.useEntity(props.entityID, "collection/type");
  return (
    <CollectionList
      editable={props.editable}
      openOnAdd={props.openOnAdd}
      attribute={props.attribute}
      entityID={props.entityID}
      cards={props.cards}
      collectionType={collectionType?.value}
    />
  );
};

const CollectionList = (props: {
  editable?: boolean;
  openOnAdd?: boolean;
  collectionType?: Fact<"collection/type">["value"];
  entityID: string;
  attribute: "desktop/contains" | "deck/contains";
  cards: Fact<"desktop/contains" | "deck/contains">[];
}) => {
  let rep = useContext(ReplicacheContext);
  let spaceID = useSpaceID();
  let { authToken } = useAuth();
  let { mutate } = useMutations();
  let onDragEnd = useOnDragEndCollection({
    parent: props.entityID,
    attribute: props.attribute,
  });
  let { setNodeRef, over } = useDroppableZone({
    type: "dropzone",
    entityID: props.entityID,
    id: "add-card-dropzone",
    onDragEnd,
  });
  const onAdd = (entity: string) => {
    if (props.editable) {
      useUIState.getState().setFocusedCard(entity);
      requestAnimationFrame(() => {
        let element = document.getElementById(`${entity}-preview-title`);

        element?.focus();
      });
    }
  };
  return (
    <div
      ref={setNodeRef}
      className="collectionCardList z-0 flex h-full flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!rep || !authToken || !spaceID) return;
        let data = await getAndUploadFile(
          e.dataTransfer.items,
          authToken,
          spaceID
        );
        if (!data.success) return;

        let entity = ulid();
        await mutate("assertFact", {
          entity,
          factID: ulid(),
          attribute: "card/image",
          value: { type: "file", id: data.data.id, filetype: "image" },
          positions: {},
        });

        let siblings =
          (await rep.rep.query((tx) => {
            return scanIndex(tx).eav(props.entityID, props.attribute);
          })) || [];

        let lastPosition = siblings.sort(sortByPosition("eav"))[
          siblings.length - 1
        ]?.positions["eav"];
        let position = generateKeyBetween(lastPosition || null, null);
        await mutate("addCardToSection", {
          factID: ulid(),
          cardEntity: entity,
          parent: props.entityID,
          section: props.attribute,
          positions: {
            eav: position,
          },
        });
      }}
    >
      {props.cards.length > 5 && (
        <div className="pb-2">
          <CardAdder
            parentID={props.entityID}
            attribute={props.attribute}
            positionKey="eav"
            openOnAdd={props.openOnAdd}
            onAdd={onAdd}
          />
        </div>
      )}
      {props.cards?.map((card) => (
        <DraggableCard
          attribute={props.attribute}
          hideContent={props.collectionType !== "cardpreview"}
          parent={props.entityID}
          editable={props.editable}
          entityID={card.value.value}
          key={card.id}
          id={card.id}
        />
      ))}
      {over ? (
        over.type === "card" ? (
          <div className="pb-2 opacity-60">
            <CardPreview
              data={over.data}
              entityID={over.entityID}
              size={"big"}
              hideContent={props.collectionType !== "cardpreview"}
              editable={props.editable}
            />
          </div>
        ) : over.type === "new-card" ? (
          <NewCardPreview />
        ) : over.type === "new-search-card" ? (
          <PlaceholderNewCard title={over.title} />
        ) : null
      ) : null}
      <CardAdder
        parentID={props.entityID}
        attribute={props.attribute}
        positionKey="eav"
        addToEnd
        openOnAdd={props.openOnAdd}
        onAdd={onAdd}
      />
    </div>
  );
};

const DraggableCard = (props: {
  editable?: boolean;
  entityID: string;
  attribute: "desktop/contains" | "deck/contains";
  hideContent?: boolean;
  id: string;
  parent: string;
}) => {
  let data = useCardPreviewData(props.entityID);
  const { attributes, listeners, setNodeRef, isDragging, isOverSomethingElse } =
    useDraggableCard({
      data: data,
      type: "card",
      id: props.id,
      parent: props.parent,
      entityID: props.entityID,
      hideContent: !!props.hideContent,
      size: "big",
    });

  let { mutate } = useMutations();
  let onDragEnd = useOnDragEndCollection(props);
  let { setNodeRef: draggableRef, over: _over } = useDroppableZone({
    type: "card",
    entityID: props.parent,
    id: props.id,
    onDragEnd,
  });

  let over = useDebouncedValue(_over, 20);

  let refs = useCombinedRefs(draggableRef, setNodeRef);
  let removeCardFromRoomHistory = useRemoveCardFromRoomHistory();

  return (
    <>
      <div
        ref={refs}
        className={`flex flex-col pb-2 ${
          isDragging ? `opacity-60 ${isOverSomethingElse ? "-mt-2" : ""}` : ""
        }`}
      >
        {over &&
          (over.type === "card" || over.type === "search-card" ? (
            over.entityID !== props.entityID && (
              <div className="pb-2 opacity-60">
                <CardPreview
                  data={over.data}
                  editable={props.editable}
                  entityID={over.entityID}
                  size={"big"}
                  hideContent={props.hideContent}
                />
              </div>
            )
          ) : over.type === "new-card" ? (
            <NewCardPreview />
          ) : over.type === "new-search-card" ? (
            <div className="pb-2 opacity-60">
              <PlaceholderNewCard title={over.title} />
            </div>
          ) : null)}
        {isOverSomethingElse ? null : (
          <div className="grow-0">
            <CardPreview
              data={data}
              entityID={props.entityID}
              size="big"
              editable={props.editable}
              dragHandleProps={{ listeners, attributes }}
              hideContent={props.hideContent}
              onDelete={() => {
                mutate("removeCardFromDesktopOrCollection", {
                  factID: props.id,
                  entityID: props.entityID,
                });
                removeCardFromRoomHistory({
                  cardEntity: props.entityID,
                  room: props.parent,
                });
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

const NewCardPreview = () => (
  <div className="mb-2 h-[62px] w-full rounded-md border border-dashed border-grey-80" />
);

let useOnDragEndCollection = (props: {
  parent: string;
  entityID?: string;
  attribute: "desktop/contains" | "deck/contains";
}) => {
  let { mutate, action, memberEntity, rep } = useMutations();
  let { open } = useCardViewer();

  return useCallback(
    async (data: DraggableData) => {
      if (!rep) return;
      action.start();

      let siblings = (
        await rep.query((tx) => {
          return scanIndex(tx).eav(props.parent, props.attribute);
        })
      ).sort(sortByPosition("eav"));

      let newIndex = props.entityID
        ? siblings.findIndex((f) => f.value.value === props.entityID) - 1
        : siblings.length - 1;

      let position = generateKeyBetween(
        siblings[newIndex]?.positions.eav || null,
        siblings[newIndex + 1]?.positions.eav || null
      );
      switch (data.type) {
        case "room":
          break;
        case "new-card": {
          let entityID = ulid();
          if (memberEntity) {
            await mutate("createCard", {
              entityID,
              title: "",
              memberEntity,
            });

            await mutate("addCardToSection", {
              factID: ulid(),
              cardEntity: entityID,
              parent: props.parent,
              section: props.attribute,
              positions: {
                eav: position,
              },
            });
          }
          break;
        }
        case "new-search-card": {
          let entityID = ulid();
          if (memberEntity) {
            await mutate("createCard", {
              entityID,
              title: data.title,
              memberEntity,
            });

            await mutate("addCardToSection", {
              factID: ulid(),
              cardEntity: entityID,
              parent: props.parent,
              section: props.attribute,
              positions: {
                eav: position,
              },
            });
          }
          open({ entityID: entityID, focus: "title" });

          break;
        }
        case "search-card": {
          await mutate("addCardToSection", {
            factID: ulid(),
            cardEntity: data.entityID,
            parent: props.parent,
            section: props.attribute,
            positions: {
              eav: position,
            },
          });
          open({ entityID: data.entityID, focus: "title" });

          break;
        }
        case "card": {
          if (data.parent !== props.parent) {
            await mutate("retractFact", { id: data.id });
            await mutate("addCardToSection", {
              factID: ulid(),
              cardEntity: data.entityID,
              parent: props.parent,
              section: props.attribute,
              positions: {
                eav: position,
              },
            });
          } else {
            let currentIndex = siblings.findIndex(
              (f) => f.value.value === data.entityID
            );
            let newPositions = updatePositions("eav", siblings, [
              [siblings[currentIndex].id, newIndex],
            ]);
            mutate("updatePositions", {
              positionKey: "eav",
              newPositions,
            });
          }

          break;
        }
        default:
          data satisfies never;
      }
      action.end();
    },
    [mutate, memberEntity, props, action, rep, open]
  );
};
