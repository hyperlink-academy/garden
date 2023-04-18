import { Textarea } from "components/Textarea";

import { useIndex, useMutations } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { FilterAttributes } from "data/Attributes";
import { useAuth } from "hooks/useAuth";
import { CardCollection } from "components/CardCollection";

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
    new?: boolean;
  } & JSX.IntrinsicElements["textarea"]
) => {
  let fact = useIndex.eav(props.entityID, props.section);
  let timeout = useRef<null | number>(null);
  let { authorized, mutate, action } = useMutations();

  return (
    <Textarea
      {...props}
      focused={props.focused}
      previewOnly={props.previewOnly || !authorized}
      placeholder={props.placeholder}
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
            if (!date) return;
            mutate("retractFact", { id: date.id });
          }}
        >
          remove
        </button>
      )}
    </div>
  );
};

export const AttachedCardSection = (props: { entityID: string }) => {
  let attachedCards = useIndex.eav(props.entityID, "deck/contains");
  return (
    <>
      {attachedCards && attachedCards.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          <CardCollection entityID={props.entityID} attribute="deck/contains" />
        </div>
      )}
    </>
  );
};
