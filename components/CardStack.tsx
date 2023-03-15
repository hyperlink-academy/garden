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

export type StackData = {
  parent: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
};

export const AddAttachedCard = (
  props: {
    expanded?: boolean;
    end?: boolean;
    onAdd?: (entity: string) => void;
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

  const alreadyInEAV = useIndex.eav(props.parent, props.attribute);

  let rep = useContext(ReplicacheContext);
  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <>
      {/* decide styling of button via children */}
      <button
        {...handlers}
        onClick={() => !isLongPress.current && setOpen(true)}
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
            props.onAdd?.(entity);
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
  props: StackData & { end?: boolean | undefined },
  rep: Replicache<ReplicacheMutators>,
  mutate: ReturnType<typeof useMutations>["mutate"]
) => {
  let position;
  let positionKey = "eav";

  let siblings =
    (await rep.query((tx) => {
      return scanIndex(tx).eav(props.parent, props.attribute);
    })) || [];

  if (props.end) {
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
    parent: props.parent,
    section: props.attribute,
    positions: {
      eav: position,
    },
  });
};
