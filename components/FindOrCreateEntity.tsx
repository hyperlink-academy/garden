import { Combobox, Dialog, Transition } from "@headlessui/react";
import { useRef, useState } from "react";
import { ButtonLink, ButtonPrimary } from "./Buttons";
import { Add, Card, Checkmark, Cross } from "./Icons";
import { Divider } from "./Layout";
import { SmallCard } from "./SmallCard";

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
  let [addedItemsList, setAddedItemsList] = useState(false);
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
          setInput("");
          isMultiSelect.current = false;
        }}
        className="fixed z-10 inset-0 overflow-y-hidden"
      >
        <Dialog.Overlay className="overlay" />

        <Combobox
          value={isMultiSelect ? added : ""}
          onChange={(optionValue: string) => {
            let findAddedItem = added.find(
              (addedItem) =>
                addedItem.type === "existing" &&
                addedItem.entity === optionValue
            );

            // if the item is already in the deck, don't do anything
            if (props.selected.includes(optionValue)) return;

            // NOTE: clicking the checkbox, shift clicking, longpress/click on a search result sets state to multiselect.
            // if isMultiSelect = false then onselect and onclose that bish
            if (isMultiSelect.current === false) {
              props.onSelect(
                optionValue === "create"
                  ? { type: "create", name: input }
                  : { entity: optionValue, type: "existing" }
              );
              props.onClose();
              setAdded([]);
              return;
            }

            // if isMultiSelect is true, and if the item is already added, then remove from added[],
            if (findAddedItem !== undefined) {
              let addedItemIndex = added.indexOf(findAddedItem);
              added.splice(addedItemIndex, 1);
              setAdded([...added]); //create a new array to force a refresh of the addedList
              return;
            }

            setAdded([
              ...added,
              optionValue === "create"
                ? { name: input, type: "create" }
                : { entity: optionValue, type: "existing" },
            ]);
          }}
          as="div"
          className={`
              relative
              max-w-md h-fit max-h-[calc(100vh-160px)]
              w-[calc(100vw-2.5rem)]
              z-10 
              mx-auto mb-20 mt-10
              flex flex-col items-stretch 
              bg-white shadow-drop border border-grey-80 rounded-md
              `}
        >
          <Combobox.Input
            value={input}
            className="mx-3 mt-4"
            placeholder="find or create cards..."
            onKeyDown={(e: React.KeyboardEvent) => {
              //HeadlessUI handles keyboard nav from here!!

              if (e.key === "Escape") {
                props.onClose();
                setAdded([]);
                isMultiSelect.current = false;
              }

              if (e.key === "Enter" && e.shiftKey) {
                console.log("trying to multiselect");
                isMultiSelect.current = true;
              }
            }}
            onChange={(e) => setInput(e.currentTarget.value)}
          />

          {/* if isMultiselect = true, take all the stuff in the added[] and display it at the top, with a submit button. If not, show nothing! */}
          {isMultiSelect.current === false ? (
            <div className="mx-3 mt-2 mb-2">
              <small className="italic text-grey-55 hidden sm:block">
                SHIFT + click to select multiple cards!
              </small>
              <small className="italic text-grey-55  sm:hidden ">
                longpress to select multiple cards!
              </small>
            </div>
          ) : (
            <div className="addedList flex flex-col gap-2 mx-3 mt-2 mb-3">
              {addedItemsList === false ? null : (
                <ul className="flex flex-col gap-2 p-3 lightBorder bg-bg-blue no-scrollbar">
                  {added.length === 0 ? (
                    <div className="text-grey-55 italic ">
                      no cards selected yet!
                    </div>
                  ) : (
                    added.map((addedItem) => (
                      <li className="addedListItem grid grid-cols-[max-content_auto_max-content] gap-2 ">
                        <div className="pt-[1px]">
                          {addedItem.type === "create" ? (
                            <Card />
                          ) : (
                            props.items.find(
                              (item) =>
                                addedItem.type === "existing" &&
                                item.entity === addedItem.entity
                            )?.icon
                          )}
                        </div>
                        <div>
                          {addedItem.type === "create" && addedItem.name !== ""
                            ? addedItem.name
                            : addedItem.type === "create" &&
                              addedItem.name === ""
                            ? "New Untitled Card"
                            : props.items.find(
                                (item) =>
                                  addedItem.type === "existing" &&
                                  item.entity === addedItem.entity
                              )?.display}
                        </div>
                        <button
                          className=""
                          onClick={() => {
                            added.splice(added.indexOf(addedItem), 1);
                            setAdded([...added]);
                          }}
                        >
                          <Cross />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
              <div className="addedListActions grid grid-cols-[auto_max-content] items-center">
                <button
                  className="text-left text-grey-55 hover:text-accent-blue"
                  onClick={() => {
                    setAddedItemsList(!addedItemsList);
                  }}
                >
                  {addedItemsList === true ? "hide" : "show"}
                </button>
                <ButtonPrimary
                  content={`Add ${added.length} Cards!`}
                  onClick={() => {
                    added.map((addedItem) => props.onSelect(addedItem));
                    props.onClose();
                    setAdded([]);
                    isMultiSelect.current = false;
                  }}
                />
              </div>
            </div>
          )}
          <Divider />
          <Combobox.Options
            static
            className="w-full pt-2 flex-col flex gap-2 h-min overflow-y-auto"
          >
            {!input && !props.allowBlank ? null : (
              <CreateButton
                value={input}
                inputExists={!!inputExists}
                setMultiSelect={() => {
                  isMultiSelect.current = true;
                }}
                addItem={(value) => {
                  if (
                    added.find((f) => f.type === "create" && f.name === value)
                  )
                    return;
                  setAdded([...added, { type: "create", name: value }]);
                }}
              />
            )}
            {items.map((item) => {
              return (
                <SearchResult
                  {...item}
                  addItem={(optionValue) => {
                    if (
                      added.find(
                        (f) => f.type === "existing" && f.entity === optionValue
                      )
                    )
                      return;
                    setAdded([
                      ...added,
                      { type: "existing", entity: optionValue },
                    ]);
                  }}
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
                  }}
                />
              );
            })}
          </Combobox.Options>
        </Combobox>
      </Dialog>
    </Transition>
  );
};

const CreateButton = (props: {
  value: string;
  inputExists: boolean;
  addItem: (value: string) => void;
  setMultiSelect: () => void;
}) => {
  return (
    <Combobox.Option
      key={"create"}
      value={"create"}
      disabled={props.inputExists}
    >
      {({ active }) => {
        return (
          <SearchItem
            active={active}
            onLongPress={() => props.addItem(props.value)}
            setMultiSelect={props.setMultiSelect}
          >
            {!props.inputExists || props.value === "" ? (
              <div
                className={`py-2 w-full
                          text-accent-blue font-bold 
                          grid grid-cols-[min-content_auto] gap-2
                          cursor-pointer`}
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
    addItem: (s: string) => void;
    setMultiSelect: () => void;
  }
) => {
  return (
    <Combobox.Option
      key={props.entity}
      value={props.entity}
      disabled={props.disabled}
    >
      {({ active }) => {
        return (
          <SearchItem
            active={active}
            setMultiSelect={props.setMultiSelect}
            onLongPress={() => props.addItem(props.entity)}
          >
            <style jsx>
              {`
                .searchResult:hover .searchResultEmptyCheck {
                  display: block;
                }
              `}
            </style>
            <div
              className={`searchResult select-none gap-2 grid grid-cols-[min-content_auto_min-content] ${
                props.disabled
                  ? " text-grey-80 cursor-default"
                  : "cursor-pointer"
              }`}
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
  onLongPress: () => void;
  setMultiSelect: () => void;
}> = (props) => {
  let isLongPress = useRef(false);
  let longPressTimer = useRef<number>();

  const TriggerLongPress = () => {
    isLongPress.current = false;

    longPressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      props.setMultiSelect();
      props.onLongPress();
    }, 500);
  };
  return (
    <div
      onClick={(e) => {
        if (e.shiftKey) {
          props.setMultiSelect();
        }
        if (isLongPress.current) {
          e.preventDefault();
        }
      }}
      // START LONGPRESS LOGIC
      // If you LongPress or LongClick, you will trigger multiselect. Here, we start a timer for .5 seconds when the user clicks
      onMouseDown={() => {
        TriggerLongPress();
      }}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={() => {
        TriggerLongPress();

        console.log("touch");
      }}
      // If the user clicks for .5 seconds or more, then isMultiselect = true. Else, just regular click.
      onMouseUp={(e) => {
        window.clearTimeout(longPressTimer.current);

        if (isLongPress.current === true) {
          console.log("longpressed!");
        }
      }}
      onTouchEnd={(e) => {
        window.clearTimeout(longPressTimer.current);

        if (isLongPress.current === true) {
          console.log("notouch");
        }
      }}
      //END LONGPRESS LOGIC
      className={`w-full px-3 py-0.5 ${props.className || ""} ${
        props.active ? "bg-bg-blue" : ""
      }`}
    >
      {props.children}
    </div>
  );
};
