import { Combobox, Dialog, Transition } from "@headlessui/react";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { Add, Checkmark } from "./Icons";

// Can I adapt this to work for section names as well?
// They are a single select
// use react state not replicache state

type Item = { display: string; entity: string; icon?: React.ReactElement };

export const FindOrCreate = (props: {
  allowBlank: boolean;
  open: boolean;
  onClose: () => void;
  items: Item[];
  selected: string[];
  onSelect: (
    id: { entity: string; type: "existing" } | { name: string; type: "create" }
  ) => void;
}) => {
  let [input, setInput] = useState("");
  let [added, setAdded] = useState<{ name: string; type: string }[]>([]);

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
            onChange={(addedItem: string) => {
              if (props.selected.includes(addedItem)) return;
              if (addedItem === "create")
                setAdded([...added, { name: input, type: "create" }]);
              else {
                setAdded([...added, { name: addedItem, type: "existing" }]);
              }
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
            <ul>
              {added.map((addedItem) => (
                <li>
                  {
                    items.find((item) => item.entity === addedItem.name)
                      ?.display
                  }
                </li>
              ))}
            </ul>
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
              className="w-full pt-2 flex-col flex gap-2 h-min max-h-[calc(100vh-16rem)] overflow-y-auto"
            >
              {inputExists || (!input && props.allowBlank) ? null : (
                <CreateButton value={input} />
              )}
              {items.map((item) => {
                return (
                  <SearchResult
                    {...item}
                    selected={props.selected.includes(item.entity)}
                  />
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

const CreateButton = (props: { value: string }) => {
  return (
    <Combobox.Option key={"create"} value={"create"}>
      {({ active }) => {
        return (
          <SearchItem active={active}>
            <div
              className={`py-2 w-full
                          text-accent-blue font-bold 
                          grid grid-cols-[min-content_auto] gap-2`}
            >
              <Add />
              <div>
                {!props.value
                  ? "Create a blank card"
                  : `Create "${props.value}"`}
              </div>
            </div>
          </SearchItem>
        );
      }}
    </Combobox.Option>
  );
};

const SearchResult = (props: Item & { selected: boolean }) => {
  return (
    <Combobox.Option key={props.entity} value={props.entity}>
      {({ active }) => {
        return (
          <SearchItem active={active}>
            <div
              className={`gap-2 items-center ${
                props.selected
                  ? "grid grid-cols-[min-content_auto_min-content] text-grey-80 "
                  : "grid grid-cols-[min-content_auto]"
              }`}
            >
              {props.icon}
              {props.display}
              {props.selected ? (
                <Checkmark className="justify-self-end" />
              ) : null}
            </div>
          </SearchItem>
        );
      }}
    </Combobox.Option>
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
