import React, { useContext, useState } from "react";
import { ReferenceAttributes } from "data/Attributes";
import {
  ReplicacheContext,
  ReplicacheMutators,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { ulid } from "src/ulid";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { useLongPress } from "hooks/useLongPress";
import { Replicache } from "replicache";
import { useCardViewer } from "./CardViewerContext";
import { CardSearch } from "./Icons";

export type StackData = {
  parentID: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
  addToEnd?: boolean | undefined;
};

export const CardAdder = (
  props: { openOnAdd?: boolean | undefined; addToEnd?: boolean } & StackData
) => {
  let { authorized, mutate, memberEntity, action } = useMutations();
  let rep = useContext(ReplicacheContext);
  let { open } = useCardViewer();

  if (!authorized) {
    return null;
  } else
    return (
      <div className="justify-left flex w-full shrink-0 items-center gap-2 rounded-lg border  border-dashed border-grey-80 px-2 py-1 text-sm text-grey-55 group-hover:border-accent-blue">
        <button
          className="group grow text-left font-bold hover:text-accent-blue"
          onClick={async () => {
            if (!memberEntity) return;
            action.start();
            let entity = ulid();
            await mutate("createCard", {
              entityID: entity,
              title: "",
              memberEntity,
            });
            if (props.openOnAdd) {
              open({ entityID: entity, focus: "title" });
            } else null;
            if (rep === null) {
              return;
            } else {
              create(entity, props, rep.rep, mutate);
            }

            action.end();
          }}
        >
          <p>create new</p>
        </button>
        <div className=" h-4 w-[1px] border-l border-dashed text-grey-80" />
        <AddExistingCard
          onAdd={(entity, d) => {
            if (props.openOnAdd) {
              open({
                entityID: entity,
                focus:
                  d.type === "create"
                    ? d.name
                      ? "content"
                      : "title"
                    : undefined,
              });
            } else null;
          }}
          addToEnd={props.addToEnd}
          parentID={props.parentID}
          positionKey="eav"
          attribute={props.attribute}
        >
          <div className={`text-grey-55 hover:text-accent-blue`}>
            <CardSearch />
          </div>
        </AddExistingCard>
      </div>
    );
};

export const AddExistingCard = (
  props: {
    expanded?: boolean;
    onAdd?: (
      entity: string,
      addedItem:
        | { entity: string; type: "existing" }
        | { name: string; type: "create"; cardType: "card" }
    ) => void;
    onClick?: () => void;
    children: React.ReactNode;
  } & StackData
) => {
  let [open, setOpen] = useState(false);
  let { handlers, isLongPress } = useLongPress(async () => {
    if (!rep?.rep) return;
    let entity = ulid();
    create(entity, props, rep.rep, mutate);
  });
  let items = useAllItems(open);

  const alreadyInEAV = useIndex.eav(props.parentID, props.attribute);

  let rep = useContext(ReplicacheContext);
  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <>
      {/* decide styling of button via children */}
      <button
        {...handlers}
        onClick={() => {
          !isLongPress.current && setOpen(true);
          {
            props.onClick ? props.onClick() : null;
          }
        }}
      >
        {/* {props.expanded ? "Attach Card" : ""} */}
        {props.children}
      </button>
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (cards) => {
          if (!rep?.rep || !memberEntity) return;
          // if youre adding to a backlink section, then the entity is a string
          // if youre creating a new deck

          action.start();

          for (let d of cards) {
            let entity: string;
            if (d.type === "existing") entity = d.entity;
            else {
              entity = ulid();
              await mutate("createCard", {
                entityID: entity,
                title: d.name,
                memberEntity,
              });
            }
            create(entity, props, rep.rep, mutate);
            props.onAdd?.(entity, d);
          }

          action.end();
        }}
        // END OF ONSELECT LOGIC
        selected={alreadyInEAV?.map((d) => d.value.value) || []}
        open={open}
        items={items}
      />
    </>
  );
};

const create = async (
  entity: string,
  props: StackData,
  rep: Replicache<ReplicacheMutators>,
  mutate: ReturnType<typeof useMutations>["mutate"]
) => {
  let position;
  let positionKey = "eav";

  let siblings =
    (await rep.query((tx) => {
      return scanIndex(tx).eav(props.parentID, props.attribute);
    })) || [];

  if (props.addToEnd) {
    let lastPosition = siblings.sort(sortByPosition(positionKey))[
      siblings.length - 1
    ]?.positions[positionKey];
    position = generateKeyBetween(lastPosition || null, null);
  } else {
    let firstPosition = siblings.sort(sortByPosition(positionKey))[0]
      ?.positions[positionKey];
    position = generateKeyBetween(null, firstPosition || null);
  }

  await mutate("addCardToSection", {
    factID: ulid(),
    cardEntity: entity,
    parent: props.parentID,
    section: props.attribute,
    positions: {
      eav: position,
    },
  });
};
