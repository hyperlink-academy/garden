import { Textarea } from "components/Textarea";

import { useIndex, useMutations } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { sortByPosition } from "src/position_helpers";
import { FilterAttributes, ReferenceAttributes } from "data/Attributes";
import { CardStack } from "components/CardStack";

export const SingleTextSection = (
  props: {
    entityID: string;
    section: keyof FilterAttributes<{
      unique: any;
      type: "string";
      cardinality: "one";
    }>;
    focused?: boolean;
    previewOnly?: boolean;
    className?: string;
    placeholderOnHover?: boolean;
    new?: boolean;
  } & JSX.IntrinsicElements["textarea"]
) => {
  let fact = useIndex.eav(props.entityID, props.section);
  let timeout = useRef<null | number>(null);
  let { authorized, mutate, action } = useMutations();

  return (
    <Textarea
      focused={props.focused}
      previewOnly={props.previewOnly || !authorized}
      autoFocus={props.new}
      placeholderOnHover={props.placeholderOnHover}
      placeholder={props.placeholder || "write something..."}
      className={`w-full bg-inherit ${props.className || ""}`}
      spellCheck={false}
      value={(fact?.value as string) || ""}
      onChange={async (e) => {
        if (!timeout.current) action.start();
        else clearTimeout(timeout.current);
        timeout.current = window.setTimeout(() => {
          timeout.current = null;
          action.end();
        }, 200);

        await mutate("assertFact", {
          entity: props.entityID,
          attribute: props.section,
          value: e.currentTarget.value,
          positions: fact?.positions || {},
        });
      }}
    />
  );
};

export const MultipleReferenceSection = (props: {
  entityID: string;
  section: keyof ReferenceAttributes;
}) => {
  let references = useIndex.eav(props.entityID, props.section);
  return (
    <div className="flex flex-col gap-4">
      <CardStack
        positionKey="eav"
        cards={references?.sort(sortByPosition("eav")) || []}
        parent={props.entityID}
        attribute={props.section}
      />
    </div>
  );
};

export const MakeDate = (props: { entityID: string }) => {
  let { mutate, authorized } = useMutations();
  let date = useIndex.eav(props.entityID, "card/date");
  let ref = useRef<HTMLInputElement | null>(null);
  let [open, setOpen] = useState(false);

  if (!authorized || date) return null;
  if (open)
    return (
      <input
        onChange={(e) => {
          console.log(e.currentTarget.value);
          mutate("assertFact", {
            entity: props.entityID,
            attribute: "card/date",
            value: { type: "yyyy-mm-dd", value: e.currentTarget.value },
            positions: {},
          });
        }}
        type="date"
        ref={ref}
        style={{ display: "" }}
      />
    );
  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
        }}
      >
        add date
      </button>
    </>
  );
};

export const DateSection = (props: { entityID: string }) => {
  let date = useIndex.eav(props.entityID, "card/date");
  if (!date) return null;
  return (
    <div className="flex flex-col gap-2">
      <input type="date" value={date.value.value} />
      <button>remove?</button>
    </div>
  );
};
