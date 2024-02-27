import { Combobox, Dialog, Transition } from "@headlessui/react";
import { db } from "hooks/useReplicache";
import { useEffect, useRef, useState } from "react";
import { ButtonPrimary } from "./Buttons";
import {
  AddSmall,
  CardSmall,
  Checkmark,
  CloseFilledTiny,
  Member,
} from "./Icons";
import { Divider } from "./Layout";
import { useLongPress } from "hooks/useLongPress";
import { theme } from "tailwind.config";
let { colors } = theme;

// Can I adapt this to work for section names as well?
// They are a single select
// use react state not replicache state

// TOP LEVEL NOTES (6.25.22)
// FindandCreate modal draws from 2 arrays.
// Selected = things that are already included in the list you are adding to
// Added = things that you clicked after opening the modal. These aren't added yet, but will be once you hit submit.

type Item = {
  display: string;
  entity: string;
  icon?: React.ReactElement;
};
type AddedItem =
  | { entity: string; type: "existing" }
  | { name: string; type: "create"; cardType: "card" };

export const FindOrCreate = (props: {
  allowBlank: boolean;
  open: boolean;
  onClose: () => void;
  items: Item[];
  selected: string[];
  onSelect: (item: AddedItem[]) => void;
}) => {
  let [input, setInput] = useState("");
  let [added, setAdded] = useState<AddedItem[]>([]);
  let [addedItemsList, setAddedItemsList] = useState(false);
  let isMultiSelect = useRef(false);
  useEffect(() => {
    setInput("");
  }, [props.open]);

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
        className="fixed inset-0 z-20 overflow-y-hidden"
      >
        <Dialog.Overlay className="overlay" />

        <Combobox
          value={null}
          onChange={(optionValue: AddedItem) => {
            // if the item is already in the deck, don't do anything
            if (
              optionValue?.type === "existing"
                ? props.selected.includes(optionValue.entity)
                : props.selected.includes(optionValue.name)
            )
              return;

            // NOTE: clicking the checkbox, shift clicking, longpress/click on a search result sets state to multiselect.
            // if isMultiSelect = false then onselect and onclose that bish
            if (isMultiSelect.current === false) {
              props.onSelect([optionValue]);
              props.onClose();
              setAdded([]);
              return;
            }

            // if isMultiSelect is true, and if the item is already added, then remove from added[],
            let findAddedItem = added.find(
              (f) =>
                f.type === "existing" &&
                optionValue.type === "existing" &&
                f.entity === optionValue.entity
            );
            if (findAddedItem !== undefined) {
              let addedItemIndex = added.indexOf(findAddedItem);
              added.splice(addedItemIndex, 1);
              setAdded([...added]); //create a new array to force a refresh of the addedList

              if (added.length == 0) isMultiSelect.current = false;
              return;
            }

            setAdded([...added, optionValue]);
          }}
          as="div"
          className={`
              border-grey-80
              shadow-drop relative z-10
              mx-auto
              mb-20
              mt-10 flex h-fit
              max-h-[calc(100vh-160px)] w-[calc(100vw-2.5rem)] max-w-md
              flex-col items-stretch rounded-md border bg-white
              `}
        >
          {({ activeOption }) => (
            <>
              <Combobox.Input
                value={input}
                className="mx-3 mt-4"
                placeholder="find or create cards…"
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
                <div className="mx-3 mb-2 mt-2">
                  <span className="text-grey-55 hidden text-sm italic sm:block">
                    SHIFT + click to select multiple cards!
                  </span>
                  <span className="text-grey-55 text-sm italic sm:hidden">
                    longpress to select multiple cards!
                  </span>
                </div>
              ) : (
                <div className="addedList mx-3 mb-3 mt-2 flex flex-col gap-2">
                  {addedItemsList === false ? null : (
                    <ul className="lightBorder no-scrollbar bg-bg-blue flex flex-col gap-2 p-3">
                      {added.length === 0 ? (
                        <div className="text-grey-55 italic">
                          no cards selected yet!
                        </div>
                      ) : (
                        added.map((addedItem, index) => (
                          <li
                            key={index}
                            className="addedListItem grid grid-cols-[max-content_auto_max-content] gap-2"
                          >
                            <div className="pt-[1px]">
                              {addedItem.type === "create" ? (
                                <CardSmall />
                              ) : (
                                props.items.find(
                                  (item) =>
                                    addedItem.type === "existing" &&
                                    item.entity === addedItem.entity
                                )?.icon
                              )}
                            </div>
                            <div>
                              {addedItem.type === "create" &&
                              addedItem.name !== ""
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
                              <CloseFilledTiny />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  <div className="addedListActions grid grid-cols-[auto_max-content] items-center">
                    <button
                      className="text-grey-55 hover:text-accent-blue text-left"
                      onClick={() => {
                        setAddedItemsList(!addedItemsList);
                      }}
                    >
                      {addedItemsList === true ? "hide" : "show"}
                    </button>
                    <ButtonPrimary
                      content={`Add ${added.length} Cards!`}
                      onClick={() => {
                        props.onSelect(added);
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
                className="flex h-min w-full flex-col gap-0 overflow-y-auto pb-2 pt-2"
              >
                {!input && !props.allowBlank ? null : (
                  <CreateButton
                    value={input}
                    activeOption={
                      activeOption?.type === "create"
                        ? activeOption.cardType
                        : activeOption?.entity
                    }
                    inputExists={!!inputExists}
                    setMultiSelect={() => {
                      isMultiSelect.current = true;
                    }}
                    addItem={(value) => {
                      if (
                        added.find(
                          (f) => f.type === "create" && f.name === value
                        )
                      )
                        return;
                      setAdded([
                        ...added,
                        { type: "create", name: value, cardType: "card" },
                      ]);
                    }}
                  />
                )}
                {items.map((item, index) => {
                  return (
                    <SearchResult
                      key={index}
                      {...item}
                      addItem={(optionValue) => {
                        if (
                          added.find(
                            (f) =>
                              f.type === "existing" && f.entity === optionValue
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
            </>
          )}
        </Combobox>
      </Dialog>
    </Transition>
  );
};

const CreateButton = (props: {
  value: string;
  activeOption?: string;
  inputExists: boolean;
  addItem: (value: string) => void;
  setMultiSelect: () => void;
}) => {
  let value: AddedItem = {
    type: "create",
    cardType: "card",
    name: props.value,
  };

  return (
    <div className="flex flex-row">
      <Combobox.Option
        key={"create"}
        value={value}
        className="flex-grow"
        disabled={props.inputExists}
      >
        {({ active }) => {
          return (
            <SearchItem
              active={active}
              onLongPress={() => props.addItem(props.value)}
              setMultiSelect={props.setMultiSelect}
              className={`w-full flex-grow ${active ? "bg-bg-blue" : ""}`}
            >
              {!props.inputExists || props.value === "" ? (
                <div
                  className={`text-accent-blue flex
                          w-full flex-grow
                          cursor-pointer flex-row justify-between
                          p-1
                          font-bold`}
                >
                  <div className="flex flex-row gap-2">
                    <AddSmall />
                    <div>
                      {!props.value
                        ? `Create a blank card`
                        : `Create "${props.value}"`}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-grey-55 grid
                          w-full grid-cols-[min-content_auto]
                          gap-2 p-1 font-bold`}
                >
                  <AddSmall />
                  <div>{`"${props.value}"`} already exists</div>
                </div>
              )}
            </SearchItem>
          );
        }}
      </Combobox.Option>
    </div>
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
  let value: AddedItem = { type: "existing", entity: props.entity };
  let cardBackgroundColor =
    db.useEntity(props.entity, "card/background-color")?.value || "#FFFFFF";
  return (
    <Combobox.Option key={props.entity} value={value} disabled={props.disabled}>
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
              style={{
                backgroundColor:
                  cardBackgroundColor === "#FFFFFF"
                    ? "transparent"
                    : cardBackgroundColor,
                border:
                  cardBackgroundColor === "#FFFFFF"
                    ? "none"
                    : `1px solid ${colors["grey-90"]}`,
              }}
              className={`searchResult  my-[2px] grid select-none grid-cols-[min-content_auto_min-content] gap-2 rounded-md  px-1 py-0.5 ${
                props.disabled
                  ? "text-grey-80 cursor-default"
                  : "cursor-pointer"
              }`}
            >
              <div className="searchResultIcon mt-[1px]">{props.icon}</div>
              <div className="searchResultName">{props.display} hello</div>
              {props.disabled ? (
                <Checkmark className="searchReultSelectedCheck text-grey-90 mt-[5px] justify-self-end" />
              ) : props.added ? (
                <Checkmark className="searchResultAddedCheck text-accent-blue mt-[5px]" />
              ) : (
                <div
                  className="searchResultEmptyCheck text-grey-55 hover:text-accent-blue mt-[5px] h-4 w-4 rounded-full border border-dashed hover:border-2 sm:hidden"
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

const SearchItem: React.FC<
  React.PropsWithChildren<{
    active: boolean;
    className?: string;
    onLongPress: () => void;
    setMultiSelect: () => void;
  }>
> = (props) => {
  let { handlers, isLongPress } = useLongPress(() => {
    props.setMultiSelect();
    props.onLongPress();
  });

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
      {...handlers}
      className={`w-full px-2 py-0.5 ${props.className || ""} ${
        props.active ? "bg-bg-blue" : ""
      }`}
    >
      {props.children}
    </div>
  );
};

export const useAllItems = (open: boolean) => {
  let titles = db
    .useAttribute(open ? "card/title" : null)
    .filter((f) => !!f.value);
  let members = db.useAttribute("member/name");
  return titles
    .map((t) => {
      return {
        entity: t.entity,
        display: t.value,
        icon: <CardSmall />,
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
    )
    .reverse();
};
