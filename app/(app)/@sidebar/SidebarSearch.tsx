import { CloseLinedTiny } from "components/Icons";
import { useEffect, useRef, useState } from "react";

export function useSearchState() {
  let [input, setInput] = useState("");
  let [selectedItemIndex, setSelectedItemIndex] = useState(0);
  return [input, setInput, selectedItemIndex, setSelectedItemIndex];
}
export function SidebarSearchInput(props: {
  value: string;
  onChange: (s: string) => void;
  onEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  selectedItemIndex: number;
  setSelectectedItemIndex: (i: number | ((s: number) => number)) => void;
  resultsLength: number;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <input
        id="sidebar-search"
        value={props.value}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            props.onChange("");
            e.currentTarget.blur();
          }
          if (e.key === "Enter") props.onEnter(e);
          if (
            (e.key === "j" && (e.metaKey || e.ctrlKey)) ||
            e.key === "ArrowDown"
          ) {
            e.preventDefault();
            if (props.selectedItemIndex < props.resultsLength)
              props.setSelectectedItemIndex((s) => s + 1);
          }

          if (
            (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
            e.key === "ArrowUp"
          ) {
            e.preventDefault();
            if (props.selectedItemIndex > 0)
              props.setSelectectedItemIndex((s) => s - 1);
          }
        }}
        onChange={(e) => props.onChange(e.target.value)}
        className="sidebarSearch w-full px-2 py-1 text-sm outline-none"
      />
      {props.value && (
        <button
          className="absolute right-2 top-2 text-grey-80"
          onClick={() => props.onChange("")}
        >
          <CloseLinedTiny />
        </button>
      )}
    </div>
  );
}

export function SearchResults<T>(props: {
  results: Array<T>;
  getKey: (r: T) => string;
  selectedItemIndex: number;
  renderResult: (r: T) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {props.results.map((r, index) => (
        <SearchItem
          key={props.getKey(r)}
          selected={index === props.selectedItemIndex}
        >
          {props.renderResult(r)}
        </SearchItem>
      ))}
    </div>
  );
}

function SearchItem(props: { children: React.ReactNode; selected: boolean }) {
  let ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (props.selected) ref.current?.scrollIntoView({ block: "center" });
  }, [props.selected]);
  return (
    <div
      ref={ref}
      className={`${props.selected ? " bg-bg-blue" : ""} px-2 py-1`}
    >
      {props.children}
    </div>
  );
}
