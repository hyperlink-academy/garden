import { cornersOfRectangle } from "@dnd-kit/core/dist/utilities/algorithms/helpers";
import { arraySwap } from "@dnd-kit/sortable";
import { Combobox, Dialog, Transition } from "@headlessui/react";
import { type } from "os";
import { useRef, useState } from "react";
import { ButtonLink } from "./Buttons";
import { Add, Checkmark } from "./Icons";

// Can I adapt this to work for section names as well?
// They are a single select
// use react state not replicache state

// TOP LEVEL NOTES (6.25.22)
// FindandCreate modal draws from 2 arrays.
// Selected = things that are already included in the list you are adding to
// Added = things that you clicked after opening the modal. These aren't added yet, but will be once you hit submit.

type Item = { display: string; entity: string; icon?: React.ReactElement };
type AddedItem =
  | { entity: string; type: "existing" }
  | { name: string; type: "create" };

export const FindOrCreate = (props: {
  allowBlank: boolean;
  open: boolean;
  onClose: () => void;
  items: Item[];
  selected: string[];
  onSelect: (item: AddedItem) => void;
}) => {
  let [input, setInput] = useState("");
  let [added, setAdded] = useState<AddedItem[]>([]);
  let isMultiSelect = useRef(false);

  // THIS IS WHERE THE RESULTS ARE FILTERED!
  let items = props.items.filter((f) => {
    if (/[A-Z]/g.test(input)) return f.display.includes(input);
    return f.display.toLocaleLowerCase().includes(input.toLocaleLowerCase());
  });

  let inputExists =
    !!items.find(
      (i) => i.display.toLocaleLowerCase() === input.toLocaleLowerCase()
    ) ||
    !!added.find(
      (i) =>
        i.type === "create" &&
        i.name !== "" &&
        i.name.toLocaleLowerCase() === input.toLocaleLowerCase()
    );
  return (
    <Transition show={props.open} className="fixed">
      <Dialog
        onClose={() => {
          props.onClose();
          setAdded([]);
          isMultiSelect.current = false;
        }}
        className="fixed z-10 inset-0 overflow-y-hidden"
      >
        <Dialog.Overlay className="overlay" />

        <div className="">
          <Combobox
            value=""
            onChange={(optionValue: string) => {
              let findAddedItem = added.find(
                (addedItem) =>
                  addedItem.type === "existing" &&
                  addedItem.entity === optionValue
              );

              // if the item is already in the deck, don't do anything
              if (props.selected.includes(optionValue)) return;
              console.log("on change happening");
              // if the item is already in the added[], remove it!

              // NOTE: clicking the checkbox, shift clicking, longpress/click on a search result sets state to multiselect.
              // if isMultiSelect = false then onselect and onclose that bish
              if (isMultiSelect.current === false) {
                props.onSelect({ entity: optionValue, type: "existing" });
                props.onClose();
                setAdded([]);
                isMultiSelect.current = false;
              } else {
                // if isMultiSelect is true, and if the item is already added, then remove from added[],
                if (findAddedItem !== undefined) {
                  let addedItemIndex = added.indexOf(findAddedItem);
                  added.splice(addedItemIndex, 1);
                  setAdded([...added]); //create a new array to force a refresh of the addedItemsList
                }
                // ELSE add clicked items to the added[]
                else if (optionValue === "create")
                  setAdded([...added, { name: input, type: "create" }]);
                else {
                  setAdded([
                    ...added,
                    { entity: optionValue, type: "existing" },
                  ]);
                }
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
            <ul className="addedItemsList">
              {/* if isMultiselect = true, take all the stuff in the added[] and display it at the top, with a submit button. If not, show nothing! */}
              {added.map((addedItem) => (
                <li>
                  {addedItem.type === "create" && addedItem.name !== ""
                    ? addedItem.name
                    : addedItem.type === "create" && addedItem.name === ""
                    ? "New Untitled Card"
                    : props.items.find(
                        (item) =>
                          addedItem.type === "existing" &&
                          item.entity === addedItem.entity
                      )?.display}
                </li>
              ))}
              <ButtonLink
                content={`Add ${added.length} cards`}
                onClick={() => {
                  added.map((addedItem) => props.onSelect(addedItem));
                  props.onClose();
                  setAdded([]);
                  isMultiSelect.current = false;
                }}
              />
            </ul>
            <Combobox.Input
              value={input}
              className="mx-3 mt-4"
              placeholder="find or create cards..."
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Escape") {
                  props.onClose();
                  setAdded([]);
                  isMultiSelect.current = false;
                }
              }}
              onChange={(e) => setInput(e.currentTarget.value)}
            />

            <Combobox.Options
              static
              className="w-full pt-2 flex-col flex gap-2 h-min max-h-[calc(100vh-16rem)] overflow-y-auto"
            >
              {!input && !props.allowBlank ? null : (
                <CreateButton value={input} inputExists={!!inputExists} />
              )}
              {items.map((item) => {
                return (
                  <SearchResult
                    {...item}
                    disabled={props.selected.includes(item.entity)}
                    added={
                      added.find(
                        (addedItem) =>
                          addedItem.type === "existing" &&
                          addedItem.entity === item.entity
                      ) !== undefined
                    }
                    setMultiSelect={() => {
                      isMultiSelect.current = true;
                      console.log("multiSelect is " + isMultiSelect.current);
                    }}
                  />
                );
              })}
            </Combobox.Options>
          </Combobox>
        </div>
      </Dialog>
    </Transition>
  );
};

const CreateButton = (props: { value: string; inputExists: boolean }) => {
  return (
    <Combobox.Option
      key={"create"}
      value={"create"}
      disabled={props.inputExists}
    >
      {({ active }) => {
        return (
          <SearchItem active={active}>
            {!props.inputExists || props.value === "" ? (
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
            ) : (
              <div
                className={`py-2 w-full
                          text-grey-55 font-bold 
                          grid grid-cols-[min-content_auto] gap-2`}
              >
                <Add />
                <div>"{props.value}" already exists</div>
              </div>
            )}
          </SearchItem>
        );
      }}
    </Combobox.Option>
  );
};

const SearchResult = (
  props: Item & {
    disabled: boolean;
    added: boolean;
    setMultiSelect: () => void;
  }
) => {
  let isLongPress = useRef(false);
  let longPressTimer = useRef<number>();

  const TriggerLongPress = () => {
    isLongPress.current = false;

    longPressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      props.setMultiSelect();
      console.log("delayed result! " + isLongPress.current);
    }, 500);
  };
  return (
    <Combobox.Option
      key={props.entity}
      value={props.entity}
      disabled={props.disabled}
    >
      {({ active }) => {
        return (
          <SearchItem active={active}>
            <div
              className={`searchResult select-none gap-2 grid grid-cols-[min-content_auto_min-content]  ${
                props.disabled
                  ? " text-grey-80 cursor-default"
                  : "cursor-pointer"
              }`}
              onClick={(e) => {
                if (e.shiftKey) {
                  props.setMultiSelect();
                }
              }}
              // START LONGPRESS LOGIC
              // If you LongPress or LongClick, you will trigger multiselect. Here, we start a timer for .5 seconds when the user clicks
              onMouseDown={() => {
                TriggerLongPress();
              }}
              onTouchStart={() => {
                TriggerLongPress();
                console.log("touch");
              }}
              // If the user clicks for .5 seconds or more, then isMultiselect = true. Else, just regular click.
              onMouseUp={() => {
                window.clearTimeout(longPressTimer.current);

                if (isLongPress.current === true) {
                  console.log("longpressed!");
                }
              }}
              onTouchEnd={() => {
                window.clearTimeout(longPressTimer.current);

                if (isLongPress.current === true) {
                  console.log("notouch");
                }
              }}
              //END LONGPRESS LOGIC
            >
              <div className="searchResultIcon mt-[1px]">{props.icon}</div>
              <div className="searchResultName">{props.display}</div>
              {props.disabled ? (
                <Checkmark className="searchReultSelectedCheck text-grey-90 justify-self-end mt-[5px]" />
              ) : props.added ? (
                <Checkmark className="searchResultAddedCheck text-accent-blue mt-[5px]" />
              ) : (
                <div
                  className="searchResultEmptyCheck w-4 h-4 mt-[5px] rounded-full border border-dashed text-grey-55 hover:text-accent-blue hover:border-2 sm:hidden"
                  onClick={() => props.setMultiSelect()}
                />
              )}
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
