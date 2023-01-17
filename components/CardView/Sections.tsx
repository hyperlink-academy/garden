import { Menu } from "@headlessui/react";
import { Textarea } from "components/Textarea";

import { Close, DownArrow, MoreOptions, UpArrow } from "components/Icons";
import { MenuContainer, MenuItem } from "components/Layout";
import { Fact, multipleReferenceSection, singleTextSection } from "data/Facts";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { sortByPosition, updatePositions } from "src/position_helpers";
import {
  Attribute,
  FilterAttributes,
  ReferenceAttributes,
} from "data/Attributes";
import { UndoManager } from "@rocicorp/undo";
import { CardStack } from "components/CardStack";

export const Sections = (props: { entityID: string }) => {
  let sections = useIndex.eav(props.entityID, "card/section");
  return !(sections && sections.length > 0) ? null : (
    <div className="grid grid-auto-row gap-6">
      {sections.sort(sortByPosition("eav")).map((s) => (
        <Section
          position={s.positions.eav}
          name={s.value}
          entityID={props.entityID}
          key={s.value}
          factID={s.id}
        />
      ))}
    </div>
  );
};

const Section = (props: {
  name: string;
  entityID: string;
  factID: string;
  position: string | undefined;
}) => {
  let entity = useIndex.ave("name", `section/${props.name}`);
  let cardinality = useIndex.eav(entity?.entity || null, "cardinality");
  let type = useIndex.eav(entity?.entity || null, "type");
  let [focused, setFocused] = useState(false);

  let text_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_text_color" as "arbitrarySectionStringType"
  )?.value;
  // console.log(`text color: ${text_color_value}`);

  return (
    <div className="textSection grid grid-auto-rows gap-2">
      <div
        onClick={() => setFocused(true)}
        onMouseOver={() => setFocused(true)}
        onMouseLeave={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="grid grid-cols-[auto_min-content_min-content] gap-2 items-center h-6"
      >
        <h4
          style={{
            color: text_color_value ? text_color_value : undefined,
          }}
        >
          {props.name}
        </h4>
        <SectionMoreOptionsMenu
          section={`section/${props.name}`}
          entityID={props.entityID}
          display={focused}
          factID={props.factID}
        />
      </div>
      <SectionByType
        type={type?.value}
        entityID={props.entityID}
        section={props.name}
      />
    </div>
  );
};

const SectionByType = (props: {
  section: string;
  entityID: string;
  type: Fact<"type">["value"] | undefined;
}) => {
  if (!props.type) return null;
  switch (props.type) {
    case "string":
      return (
        <SingleTextSection
          entityID={props.entityID}
          section={singleTextSection(props.section)}
        />
      );
    case "reference":
      return (
        <MultipleReferenceSection
          entityID={props.entityID}
          section={multipleReferenceSection(props.section)}
        />
      );
    default:
      return null;
  }
};

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
  let [undoManager] = useState(new UndoManager());
  let timeout = useRef<null | number>(null);
  let { authorized, mutate } = useMutations();

  return (
    <Textarea
      focused={props.focused}
      previewOnly={props.previewOnly || !authorized}
      autoFocus={props.new}
      placeholderOnHover={props.placeholderOnHover}
      placeholder={props.placeholder || "write something..."}
      className={`bg-inherit w-full ${props.className || ""}`}
      spellCheck={false}
      onKeyDown={(e) => {
        if (
          (e.key === "z" && e.ctrlKey) ||
          (e.key === "z" && e.metaKey && !e.shiftKey)
        ) {
          undoManager.undo();
        }
        if (
          (e.key === "y" && e.ctrlKey) ||
          (e.key === "z" && e.metaKey && e.shiftKey)
        ) {
          undoManager.redo();
        }
        props.onKeyDown?.(e);
      }}
      value={(fact?.value as string) || ""}
      onChange={async (e) => {
        let currentValue = fact?.value || "";
        let nextValue = e.currentTarget.value;
        if (!timeout.current) undoManager.startGroup();
        else clearTimeout(timeout.current);
        timeout.current = window.setTimeout(() => {
          timeout.current = null;
          undoManager.endGroup();
        }, 200);

        undoManager.add({
          undo: async () => {
            await mutate("assertFact", {
              entity: props.entityID,
              attribute: props.section,
              value: currentValue,
              positions: fact?.positions || {},
            });
          },
          redo: async () => {
            await mutate("assertFact", {
              entity: props.entityID,
              attribute: props.section,
              value: nextValue,
              positions: fact?.positions || {},
            });
          },
        });
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
  let { authorized } = useMutations();
  let earliestCard = references?.sort(sortByPosition("eav"))[
    references.length - 1
  ];
  let [open, setOpen] = useState(false);
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

const SectionMoreOptionsMenu = (props: {
  section: string;
  display: boolean;
  factID: string;
  entityID: string;
}) => {
  let { mutate, authorized } = useMutations();
  let facts = useIndex.eav(props.entityID, props.section as keyof Attribute) as
    | Fact<any>
    | Fact<any>[]
    | null;

  let empty = Array.isArray(facts) ? facts.length === 0 : !facts?.value;

  let sections = useIndex
    .eav(props.entityID, "card/section")
    ?.sort(sortByPosition("eav"));
  let index = sections?.findIndex((s) => s.id === props.factID);

  const moveUp = async () => {
    if (index === undefined || index === -1 || !sections) return;
    if (index === 0) return;
    let newPositions = updatePositions("eav", sections, [
      [props.factID, index - 2],
    ]);
    await mutate("updatePositions", { positionKey: "eav", newPositions });
  };

  const moveDown = async () => {
    if (index === undefined || index === -1 || !sections) return;
    if (index === sections.length - 1) return;
    let newPositions = updatePositions("eav", sections, [
      [props.factID, index + 1],
    ]);
    await mutate("updatePositions", { positionKey: "eav", newPositions });
  };
  const remove = async () => {
    await mutate("retractFact", { id: props.factID });
  };

  return !authorized ? null : (
    <Menu as="div" className="relative">
      {({ open }) => {
        if (!open && !props.display) return <></>;
        return (
          <>
            <Menu.Button>
              <MoreOptions />
            </Menu.Button>
            <MenuContainer>
              <MenuItem onClick={() => moveUp()}>
                <p>Move Up</p>
                <UpArrow />
              </MenuItem>
              <MenuItem onClick={() => moveDown()}>
                <p>Move Down</p>
                <DownArrow />
              </MenuItem>
              {!empty ? null : (
                <MenuItem onClick={() => remove()}>
                  <p>Remove</p>
                  <Close />
                </MenuItem>
              )}
            </MenuContainer>
          </>
        );
      }}
    </Menu>
  );
};
