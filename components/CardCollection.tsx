import { Fact } from "data/Facts";
import { useCardPreviewData } from "hooks/CardPreviewData";
import { useAuth } from "hooks/useAuth";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { useSubscribe } from "hooks/useSubscribe";
import { useContext, useEffect, useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { getAndUploadFile } from "src/getAndUploadFile";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { ulid } from "src/ulid";
import { CardPreview } from "./CardPreview";
import { CardAdder } from "./CardStack";
import { useCardViewer } from "./CardViewerContext";
import { useCombinedRefs } from "./Desktop";
import { useDraggableCard, useDroppableZone } from "./DragContext";
import * as z from "zod";
import { useUIState } from "hooks/useUIState";

let FilterVerifier = z.array(
  z.object({
    reaction: z.string(),
    not: z.boolean(),
  })
);
type Filters = z.TypeOf<typeof FilterVerifier>;

export const CardCollection = (props: {
  entityID: string;
  editable?: boolean;
  attribute: "desktop/contains" | "deck/contains";
  cards: Fact<"desktop/contains" | "deck/contains">[];
  openOnAdd?: boolean;
}) => {
  let collectionType = useIndex.eav(props.entityID, "collection/type");
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
  let { mutate, action } = useMutations();
  let focusedCard = useUIState((s) => s.focusedCard);
  // Handles reordering cards in list via drag and drop
  let { setNodeRef, over } = useDroppableZone({
    type: "dropzone",
    entityID: "",
    id: "add-card-dropzone",
    onDragEnd: async (data) => {
      if (!rep) return;
      if (data.type !== "card") return;
      action.start();

      let siblings = (
        await rep.rep.query((tx) => {
          return scanIndex(tx).eav(props.entityID, props.attribute);
        })
      ).sort(sortByPosition("eav"));

      let newIndex = siblings.length - 1;
      if (data.parent !== props.entityID) {
        let position = generateKeyBetween(
          siblings[newIndex]?.positions.eav || null,
          siblings[newIndex + 1]?.positions.eav || null
        );

        await mutate("retractFact", { id: data.id });
        await mutate("addCardToSection", {
          factID: ulid(),
          cardEntity: data.entityID,
          parent: props.entityID,
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
      action.end();
    },
  });
  const onAdd = (entity) => {
    if (props.editable) useUIState.getState().setFocusedCard(entity);
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
          editable={props.collectionType === "cardpreview" && props.editable}
          entityID={card.value.value}
          key={card.id}
          id={card.id}
        />
      ))}
      {over && over.type === "card" && (
        <div className="opacity-60">
          <CardPreview
            data={over.data}
            entityID={over.entityID}
            size={"big"}
            hideContent={props.collectionType !== "cardpreview"}
            editable={props.collectionType === "cardpreview" && props.editable}
          />
        </div>
      )}
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

// I need to extract this to be used on the desktop as well
// I also need to extract out the useDraggable and useDroppable hooks with
// specific types

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

  let rep = useContext(ReplicacheContext);
  let { mutate, action } = useMutations();
  let { setNodeRef: draggableRef, over } = useDroppableZone({
    type: "card",
    entityID: props.entityID,
    id: props.id,
    onDragEnd: async (data) => {
      if (!rep) return;
      if (data.type !== "card") return;
      action.start();

      let siblings = (
        await rep.rep.query((tx) => {
          return scanIndex(tx).eav(props.parent, props.attribute);
        })
      ).sort(sortByPosition("eav"));

      let newIndex = siblings.findIndex(
        (f) => f.value.value === props.entityID
      );
      if (data.parent !== props.parent) {
        let position = generateKeyBetween(
          siblings[newIndex - 1]?.positions.eav || null,
          siblings[newIndex]?.positions.eav || null
        );

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
          [siblings[currentIndex].id, newIndex - 1],
        ]);
        mutate("updatePositions", {
          positionKey: "eav",
          newPositions,
        });
      }
      action.end();
    },
  });
  let { close } = useCardViewer();

  let refs = useCombinedRefs(draggableRef, setNodeRef);

  return (
    <>
      <div
        ref={refs}
        style={{}}
        className={`pb-2 ${
          isDragging ? `opacity-60 ${isOverSomethingElse ? "-mt-2" : ""}` : ""
        }`}
      >
        {over && over.entityID !== props.entityID && over.type === "card" && (
          <div className="pb-2 opacity-60">
            <CardPreview
              data={over.data}
              entityID={over.entityID}
              size={"big"}
              hideContent={props.hideContent}
            />
          </div>
        )}
        {isOverSomethingElse ? null : (
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
              close({ entityID: props.entityID });
            }}
          />
        )}
      </div>
    </>
  );
};
