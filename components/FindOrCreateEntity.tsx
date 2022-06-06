import { Combobox, Dialog, Transition } from "@headlessui/react";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";
import { ButtonLink } from "./Buttons";
import { Add, Card, Checkmark, DeckSmall, Member } from "./Icons";

// Can I adapt this to work for section names as well?
// They are a single select
// use react state not replicache state
export const FindOrCreate = (props: {
  allowBlank: boolean;
  open: boolean;
  onClose: () => void;
  items: { display: string; entity: string; icon?: React.ReactElement }[];
  selected: string[];
  onSelect: (
    id: { entity: string; type: "existing" } | { name: string; type: "create" }
  ) => void;
}) => {
  let [input, setInput] = useState("");
  let items = props.items.filter((f) => {
    if (/[A-Z]/g.test(input)) return f.display.includes(input);
    return f.display.toLocaleLowerCase().includes(input.toLocaleLowerCase());
  });
  let inputExists = !!items.find(
    (i) => i.display.toLocaleLowerCase() === input.toLocaleLowerCase()
  );
  return (
    <Transition show={props.open} className="fixed">
      <Dialog
        onClose={props.onClose}
        className="fixed z-10 inset-0 overflow-y-hidden"
      >
        <Dialog.Overlay className="overlay" />

        <div className="">
          <Combobox
            value=""
            onChange={(c) => {
              if (props.selected.includes(c)) return;
              if (c === "create")
                props.onSelect({ name: input, type: "create" });
              else props.onSelect({ entity: c, type: "existing" });
            }}
            as="div"
            className={`
              relative
              max-w-md h-fit max-h-full
              w-[calc(100vw-2.5rem)]
              z-10 
              mx-auto mb-20 mt-10
              grid grid-rows-[min-content_auto_min-content] 
              bg-white shadow-drop border border-grey-80 rounded-md
              `}
          >
            <Combobox.Input
              value={input}
              className="mx-3 mt-4"
              placeholder="find or create cards..."
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Escape") props.onClose();
              }}
              onChange={(e) => setInput(e.currentTarget.value)}
            />

            {/* I am aware the max height in the Combobox.Options is gross, but max-h-full does work and this is the best i could do D:*/}
            <Combobox.Options
              static
              className="w-full pt-2 flex-col flex gap-2 h-min max-h-[calc(100vh-12rem)] overflow-y-auto"
            >
              {inputExists ? null : (
                <Combobox.Option key={"create"} value={"create"}>
                  {input || props.allowBlank
                    ? ({ active }) => {
                        return (
                          <SearchItem active={active}>
                            <div
                              className={`
                              py-2 w-full
                              text-accent-blue font-bold 
                              grid grid-cols-[min-content_auto] gap-2
                            `}
                            >
                              <Add />
                              <div>
                                {!input
                                  ? "Create a blank card"
                                  : `Create "${input}"`}
                              </div>
                            </div>
                          </SearchItem>
                        );
                      }
                    : null}
                </Combobox.Option>
              )}
              {items.map((item) => {
                return (
                  //how to get selected items to the top of the list??? collapsable....? maybe not.
                  <Combobox.Option key={item.entity} value={item.entity}>
                    {({ active }) => {
                      return (
                        <SearchItem active={active}>
                          <div
                            className={`gap-2 items-center ${
                              props.selected.includes(item.entity)
                                ? "grid grid-cols-[min-content_auto_min-content] text-grey-80 "
                                : "grid grid-cols-[min-content_auto]"
                            }`}
                          >
                            {item.icon}
                            {item.display}
                            {props.selected.includes(item.entity) ? (
                              <Checkmark className="justify-self-end" />
                            ) : null}
                          </div>
                        </SearchItem>
                      );
                    }}
                  </Combobox.Option>
                );
              })}
            </Combobox.Options>
            <div className="h-max grid grid-cols-[auto_min-content] p-4 ">
              <h4>{props.selected.length} cards added</h4>
              <ButtonLink content="DONE!" onClick={props.onClose} />
            </div>
          </Combobox>
        </div>
      </Dialog>
    </Transition>
  );
};

export const FindOrCreateCard = (props: {
  entity: string;
  section: string;
  positionKey: string;
  open: boolean;
  allowBlank: boolean;
  onClose: () => void;
  selected: string[];
  lastPosition?: string;
}) => {
  let { mutate } = useMutations();
  let decks = useIndex.aev("deck");
  let titles = useIndex.aev("card/title").filter((f) => !!f.value);
  let members = useIndex.aev("member/name");
  let items = titles
    .map((t) => {
      return {
        entity: t.entity,
        display: t.value,
        icon: !!decks.find((d) => t.entity === d.entity) ? (
          <DeckSmall />
        ) : (
          <Card />
        ),
      };
    })
    .concat(
      members.map((m) => {
        return {
          entity: m.entity,
          display: m.value,
          icon: <Member />,
        };
      })
    );

  return (
    <FindOrCreate
      allowBlank={props.allowBlank}
      onClose={props.onClose}
      open={props.open}
      items={items}
      selected={props.selected}
      onSelect={async (e) => {
        let position = generateKeyBetween(props.lastPosition || null, null);
        let entity;

        if (e.type === "create") {
          entity = ulid();
          if (e.name) {
            await mutate("createCard", {
              entityID: entity,
              title: e.name,
            });
          }
        } else {
          entity = e.entity;
        }

        mutate("addCardToSection", {
          cardEntity: entity,
          parent: props.entity,
          positions: { [props.positionKey]: position },
          section: props.section,
        });
      }}
    />
  );
};

const SearchItem: React.FC<{
  active: boolean;
  className?: string;
}> = (props) => {
  return (
    <div
      className={`w-full px-3 py-0.5 ${props.className || ""} ${
        props.active ? "bg-bg-blue" : ""
      }`}
    >
      {props.children}
    </div>
  );
};
