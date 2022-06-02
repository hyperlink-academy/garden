import { Menu } from "@headlessui/react";
import { Textarea } from "components/Textarea";
import { ButtonSecondary } from "components/Buttons";
import { SmallCardList } from "components/SmallCardList";
import { FindOrCreateCard } from "components/FindOrCreateEntity";
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
import { useIndex, useMutations } from "hooks/useReplicache";
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
  return (
    <div className="textSection grid grid-auto-rows gap-2">
      <div className="grid grid-cols-[auto_min-content_min-content] gap-2 items-center">
        <h4>{props.name}</h4>
        <div className="text-grey-55">
          {type?.value === "string" ? <SectionText /> : <SectionLinkedCard />}
        </div>
        <SectionMoreOptionsMenu
          entityID={props.entityID}
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
  let inputEl = useRef<HTMLTextAreaElement | null>(null);
  let { authorized, mutate } = useMutations();

  return (
    <Textarea
      previewOnly={!authorized}
      autoFocus={props.new}
      ref={inputEl}
      placeholder="write something..."
      className="placeholder:italic bg-inherit w-full"
      spellCheck={false}
      value={(fact?.value as string) || ""}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await mutate("assertFact", {
          entity: props.entityID,
          attribute: props.section,
          value: e.currentTarget.value,
          positions: fact?.positions || {},
        });
        inputEl.current?.setSelectionRange(start, end);
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
      {!authorized ? null : (
        <>
          <ButtonSecondary onClick={() => setOpen(true)} content="Add Cards!" />
          <FindOrCreateCard
            entity={props.entityID}
            positionKey="eav"
            section={props.section}
            lastPosition={earliestCard?.positions["eav"]}
            open={open}
            allowBlank={true}
            onClose={() => setOpen(false)}
            selected={references?.map((c) => c.value.value) || []}
          />
        </>
      )}
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
    </Menu>
  );
};
