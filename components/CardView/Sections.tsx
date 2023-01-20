import { Textarea } from "components/Textarea";

import { useIndex, useMutations } from "hooks/useReplicache";
import { useRef } from "react";
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
      className={`bg-inherit w-full ${props.className || ""}`}
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
