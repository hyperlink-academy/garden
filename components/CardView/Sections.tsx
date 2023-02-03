import { Textarea } from "components/Textarea";

import { useIndex, useMutations } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { sortByPosition } from "src/position_helpers";
import { FilterAttributes, ReferenceAttributes } from "data/Attributes";
import { CardStack } from "components/CardStack";
import { useAuth } from "hooks/useAuth";

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

export const DateSection = (props: { entityID: string }) => {
  let [editing, setEditing] = useState(false);

  let { session } = useAuth();
  let { mutate, authorized } = useMutations();

  let date = useIndex.eav(props.entityID, "card/date");
  if (!date) return null;
  return (
    <div className="flex gap-2">
      {editing ? (
        <input type="date" value={date.value.value} />
      ) : (
        <span>{date.value.value}</span>
      )}
      {!authorized ? null : (
        <button
          className="justify-self-center text-sm text-grey-55 hover:text-accent-blue"
          onClick={() => {
            if (!date || !session.token) return;
            mutate("retractFact", { id: date.id });
          }}
        >
          remove
        </button>
      )}
    </div>
  );
};
