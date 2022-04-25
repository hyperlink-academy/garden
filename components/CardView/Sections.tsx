import { Menu, Transition } from "@headlessui/react";
import Textarea from "components/AutosizeTextArea";
import { ButtonPrimary } from "components/Buttons";
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
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";

export const Sections = (props: { entityID: string }) => {
  let sections = useIndex.eav(props.entityID, "card/section");
  return !(sections && sections.length > 0) ? null : (
    <div className="grid grid-auto-row gap-6">
      {sections?.map((s) => (
        <Section name={s.value} entityID={props.entityID} key={s.value} />
      ))}
    </div>
  );
};

const Section = (props: { name: string; entityID: string }) => {
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
        <SectionMoreOptionsMenu />
      </div>
      {type?.value === "string" ? (
        <SingleTextSection entityID={props.entityID} section={props.name} />
      ) : type?.value === "reference" && cardinality?.value === "many" ? (
        <MultipleReferenceSection
          section={props.name}
          entityID={props.entityID}
        />
      ) : null}
    </div>
  );
};

const SingleTextSection = (props: {
  entityID: string;
  section: string;
  new?: boolean;
}) => {
  let fact = useIndex.eav(props.entityID, singleTextSection(props.section));
  let inputEl = useRef<HTMLTextAreaElement | null>(null);
  let { authorized, mutate } = useMutations();

  return !authorized ? (
    <div className="whitespace-pre-wrap">{(fact?.value as string) || ""}</div>
  ) : (
    <Textarea
      autoFocus={props.new}
      ref={inputEl}
      className="w-full"
      value={(fact?.value as string) || ""}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await mutate("assertFact", {
          entity: props.entityID,
          attribute: singleTextSection(props.section),
          value: e.currentTarget.value,
          positions: fact?.positions || {},
        });
        inputEl.current?.setSelectionRange(start, end);
      }}
    />
  );
};

const MultipleReferenceSection = (props: {
  entityID: string;
  section: string;
}) => {
  let attribute = multipleReferenceSection(props.section);
  let references = useIndex.eav(props.entityID, attribute);
  let { authorized } = useMutations();
  let earliestCard = references?.sort(sortByPosition("eav"))[
    references.length - 1
  ];
  let [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col">
      {!authorized ? null : (
        <>
          <ButtonPrimary
            onClick={() => setOpen(true)}
            content="search to add cards"
          />
          <FindOrCreateCard
            entity={props.entityID}
            positionKey="eav"
            section={attribute}
            lastPosition={earliestCard?.positions["eav"]}
            open={open}
            allowBlank={true}
            onClose={() => setOpen(false)}
            selected={references?.map((c) => c.value.value) || []}
          />
        </>
      )}
      <div className="-mt-4">
        {/* hack to remove extra space*/}
        <SmallCardList
          attribute={attribute}
          cards={references || []}
          deck={props.entityID}
          positionKey="eav"
        />
      </div>
    </div>
  );
};

const SectionMoreOptionsMenu = () => {
  let { mutate, authorized } = useMutations();
  return !authorized ? null : (
    <Menu as="div" className="relative">
      <Menu.Button>
        <MoreOptions />
      </Menu.Button>
      <MenuContainer>
        <MenuItem>
          <button className="flex items-center gap-2 justify-end">
            <p>Move Up</p>
            <UpArrow />
          </button>
        </MenuItem>
        <MenuItem>
          <button className="flex items-center gap-2 justify--end">
            <p>Move Down</p>
            <DownArrow />
          </button>
        </MenuItem>
        <MenuItem>
          <button className="flex items-center gap-2 justify-end">
            <p>Remove</p>
            <Close />
          </button>
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};
