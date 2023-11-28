import * as Popover from "@radix-ui/react-popover";
import { db } from "hooks/useReplicache";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const Autocomplete = (props: {
  top: number;
  left: number;
  selected: number;
  suggestions: string[];
  onClick: (item: string) => void;
  suggestionPrefix: string;
}) => {
  return (
    <Popover.Root open>
      {createPortal(
        <Popover.Anchor
          style={{
            top: props.top,
            left: props.left,
            position: "absolute",
          }}
        />,
        document.body
      )}
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-10 max-h-32 w-64 overflow-y-scroll rounded-md border border-grey-80 bg-white py-0 text-grey-35"
        >
          <ul className="text-sm">
            {props.suggestions.map((result, index) => {
              return (
                <ListItem
                  key={result}
                  onClick={props.onClick}
                  index={index}
                  selectedIndex={props.selected}
                  value={result}
                />
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

const ListItem = (props: {
  value: string;
  index: number;
  onClick: (item: string) => void;
  selectedIndex: number;
}) => {
  let el = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (el.current && props.selectedIndex === props.index) {
      el.current.scrollIntoView({
        block: "nearest",
      });
    }
  }, [el, props.index, props.selectedIndex]);
  return (
    <li
      ref={el}
      onMouseDown={(e) => {
        e.preventDefault();
        props.onClick(props.value);
      }}
      className={`px-2 py-1 hover:cursor-pointer hover:bg-bg-blue ${
        props.index === props.selectedIndex ? "bg-bg-blue" : ""
      }`}
    >
      {props.value}
    </li>
  );
};

export const useSuggestions = (props: { disabled: boolean }) => {
  let [suggestionPrefix, setSuggestionPrefix] = useState<undefined | string>();
  let [suggestionIndex, setSuggestionIndex] = useState(0);
  let names = db.useAttribute("card/title");
  let suggestions = useMemo(
    () =>
      !suggestionPrefix || props.disabled
        ? []
        : names.filter((title) =>
            title.value
              .toLocaleLowerCase()
              .includes(suggestionPrefix?.toLocaleLowerCase() || "")
          ),
    [suggestionPrefix, names, props.disabled]
  );
  useEffect(() => {
    if (suggestionIndex > suggestions.length - 1)
      setSuggestionIndex(suggestions.length - 1);
  }, [suggestionIndex, suggestions]);

  return {
    suggestions: suggestions,
    suggestionIndex,
    setSuggestionIndex,
    suggestionPrefix,
    close: () => setSuggestionPrefix(undefined),
    setSuggestionPrefix,
  };
};
