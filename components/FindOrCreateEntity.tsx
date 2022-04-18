import { Combobox, Dialog, Transition } from "@headlessui/react";
import { useIndex } from "hooks/useReplicache";
import { useState } from "react";
import { Card, DeckSmall } from "./Icons";

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
    <Transition show={props.open}>
      <Dialog
        onClose={props.onClose}
        className="fixed z-10 inset-0 overflow-y-hidden"
      >
        <Dialog.Overlay className="fixed inset-0 bg-grey-90 opacity-30" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative w-[80vw] min-w-[384px] mx-auto max-w-md">
            <Combobox
              value=""
              onChange={(c) => {
                if (c === "create")
                  props.onSelect({ name: input, type: "create" });
                else props.onSelect({ entity: c, type: "existing" });
              }}
              as="div"
              className="relative z-10 w-full"
            >
              <Combobox.Input
                value={input}
                className="w-full p-2 rounded-md border-grey-55 border"
                placeholder="search or create"
                onChange={(e) => setInput(e.currentTarget.value)}
              />
              <Combobox.Options
                static
                className="w-full py-4 flex-col flex gap-2 bg-white mt-2 mb-8 rounded-md h-[80vh] overflow-y-auto shadow-drop"
              >
                {inputExists ? null : (
                  <Combobox.Option key={"create"} value={"create"}>
                    {input || props.allowBlank
                      ? ({ active }) => {
                          return (
                            <SearchItem active={active}>
                              <div className="px-2 p-1.5 border-2 border-b-accent-blue rounded-md text-accent-blue font-bold w-full bg-white">
                                {!input
                                  ? "Create a blank card"
                                  : `Create "${input}"`}
                              </div>
                            </SearchItem>
                          );
                        }
                      : null}
                  </Combobox.Option>
                )}
                {items.map((item) => {
                  return (
                    <Combobox.Option key={item.entity} value={item.entity}>
                      {({ active }) => {
                        return (
                          <SearchItem active={active}>
                            <div
                              className={`flex flex-row gap-2 items-center ${
                                props.selected.includes(item.entity)
                                  ? "bg-test-pink"
                                  : ""
                              }`}
                            >
                              {item.icon}
                              {item.display}
                            </div>
                          </SearchItem>
                        );
                      }}
                    </Combobox.Option>
                  );
                })}
              </Combobox.Options>
            </Combobox>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export const FindOrCreateCard = (props: {
  open: boolean;
  allowBlank: boolean;
  onClose: () => void;
  selected: string[];
  onSelect: (
    id: { entity: string; type: "existing" } | { name: string; type: "create" }
  ) => void;
}) => {
  let decks = useIndex.aev("deck");
  let titles = useIndex.aev("card/title");
  let items = titles.map((t) => {
    return {
      entity: t.entity,
      display: t.value,
      icon: !!decks.find((d) => t.entity === d.entity) ? (
        <DeckSmall />
      ) : (
        <Card />
      ),
    };
  });

  return (
    <FindOrCreate
      allowBlank={props.allowBlank}
      onClose={props.onClose}
      open={props.open}
      items={items}
      selected={props.selected}
      onSelect={props.onSelect}
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
