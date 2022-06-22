import { Menu } from "@headlessui/react";
import { Textarea } from "components/Textarea";
import { SmallCardList } from "components/SmallCardList";
import {
  Close,
  DownArrow,
  MoreOptions,
  SectionLinkedCard,
  SectionText,
  UpArrow,
} from "components/Icons";
import { MenuContainer, MenuItem } from "components/Layout";
import { multipleReferenceSection, singleTextSection } from "data/Facts";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { FilterAttributes, ReferenceAttributes } from "data/Attributes";

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
        <h4>{props.name}</h4>
        <SectionMoreOptionsMenu
          entityID={props.entityID}
          display={focused}
          factID={props.factID}
        />
      </div>
      {type?.value === "string" ? (
        <SingleTextSection
          entityID={props.entityID}
          section={singleTextSection(props.name)}
        />
      ) : type?.value === "reference" && cardinality?.value === "many" ? (
        <MultipleReferenceSection
          section={multipleReferenceSection(props.name)}
          entityID={props.entityID}
        />
      ) : null}
    </div>
  );
};

export const SingleTextSection = (props: {
  entityID: string;
  section: keyof FilterAttributes<{
    unique: any;
    type: "string";
    cardinality: "one";
  }>;
  new?: boolean;
}) => {
  let fact = useIndex.eav(props.entityID, props.section);
  let { authorized, mutate } = useMutations();

  return (
    <Textarea
      previewOnly={!authorized}
      autoFocus={props.new}
      placeholder="write something..."
      className="placeholder:italic bg-inherit w-full"
      spellCheck={false}
      value={(fact?.value as string) || ""}
      onChange={async (e) => {
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
      <div className="">
        {/* hack to remove extra space*/}
        <SmallCardList
          attribute={props.section}
          cards={references || []}
          deck={props.entityID}
          positionKey="eav"
        />
      </div>
    </div>
  );
};

const SectionMoreOptionsMenu = (props: {
  display: boolean;
  factID: string;
  entityID: string;
}) => {
  let { mutate, authorized } = useMutations();
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

  return !authorized ? null : (
    <Menu as="div" className="relative">
      {({ open }) => {
        if (!open && !props.display) return null;
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
              <MenuItem>
                <p>Remove</p>
                <Close />
              </MenuItem>
            </MenuContainer>
          </>
        );
      }}
    </Menu>
  );
};
