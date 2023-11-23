import { db, useMutations } from "hooks/useReplicache";
import { useEffect, useRef, useState } from "react";
import { CardPreview, PlaceholderNewCard } from "./CardPreview";
import * as Popover from "@radix-ui/react-popover";
import { useCardPreviewData } from "hooks/CardPreviewData";
import { useIsElementOrChildFocused } from "hooks/utils";
import { useDraggableCard, useDroppableZone } from "./DragContext";
import { CloseLinedTiny, Question, RoomSearch, SearchSmall } from "./Icons";
import { animated, useSpring } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { useCombinedRefs } from "./Desktop";
import { ulid } from "src/ulid";
import { useCardViewer } from "./CardViewerContext";
import { useGesture } from "@use-gesture/react";
import { useViewportSize } from "hooks/useViewportSize";
import { HelpModal } from "./HelpCenter";

let useSearch = () => {
  let [input, setInput] = useState("");
  let cards = db.useAttribute("card/title");
  let results = cards.filter(
    (c) =>
      c.value &&
      input.length > 2 &&
      (!input ||
        c.value.toLocaleLowerCase().includes(input.toLocaleLowerCase()))
  );
  let exactMatch = input && !!cards.find((c) => c.value === input);
  return { input, setInput, results, exactMatch };
};

export function Search() {
  let { input, setInput, results, exactMatch } = useSearch();
  let { open: openCard } = useCardViewer();
  let [open, setOpen] = useState(false);
  let [focused, ref] = useIsElementOrChildFocused();
  let inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (e.key == "k" && (e.metaKey || e.ctrlKey)) {
        setOpen(true);
        inputRef.current?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  let [suggestionIndex, setSuggestionIndex] = useState<number>(0);
  useEffect(() => {
    setOpen(focused);
  }, [focused]);

  let { authorized, mutate, memberEntity } = useMutations();
  return (
    <Popover.Root open>
      <div style={{ width: 336 }}>
        <Popover.Anchor />
        <Popover.Portal>
          <Popover.Content
            ref={ref}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`no-scrollbar z-0 -mr-4 flex max-h-80 flex-col gap-2 overflow-x-scroll text-sm ${
              open
                ? "-mt-2 rounded-md border-grey-90 bg-white py-2 shadow-drop"
                : ""
            }`}
            style={{ width: "var(--radix-popper-anchor-width)" }}
          >
            <div className="sticky top-0 z-20 px-2">
              <RoomSearch className="absolute right-4 top-2 text-grey-55" />
              <input
                ref={inputRef}
                onKeyDown={async (e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                  if (e.key === "Enter") {
                    //New Card
                    if (suggestionIndex === results.length && !exactMatch) {
                      if (!authorized || !memberEntity) return;
                      let entityID = ulid();
                      await mutate("createCard", {
                        entityID,
                        title: input,
                        memberEntity,
                      });
                      openCard({ entityID, focus: "content" });
                      setOpen(false);
                    } else {
                      let entityID = results[suggestionIndex].entity;
                      setOpen(false);
                      e.currentTarget.blur();
                      openCard({ entityID, focus: "content" });
                    }
                  }

                  if (
                    (e.key === "j" && (e.metaKey || e.ctrlKey)) ||
                    e.key === "ArrowDown"
                  ) {
                    e.preventDefault();
                    if (suggestionIndex < results.length)
                      setSuggestionIndex((s) => s + 1);
                  }

                  if (
                    (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
                    e.key === "ArrowUp"
                  ) {
                    e.preventDefault();
                    if (suggestionIndex > 0) setSuggestionIndex((s) => s - 1);
                  }
                }}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                className="w-full px-2 py-1 outline-none"
                placeholder="search cards..."
              />
            </div>
            <div className="z-10 flex w-full flex-col">
              {open && (
                <div className="flex flex-col gap-2 px-2 pb-2 text-grey-55">
                  <p className="text-sm">
                    <i>hold and drag cards to move to room</i>
                  </p>
                  {input && results.length > 0 && <hr />}
                </div>
              )}
              {open && input.length > 0 && (
                <SearchResults
                  onClick={() => setOpen(false)}
                  results={results}
                  suggestionIndex={suggestionIndex}
                />
              )}
              {open && input && !exactMatch && (
                <div
                  className={`p-2 ${
                    suggestionIndex === results.length ? "bg-bg-blue" : ""
                  }`}
                >
                  <NewCard title={input} onClick={() => setOpen(false)} />
                </div>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
let SearchResults = (props: {
  results: { entity: string }[];
  onClick: () => void;
  suggestionIndex: number | null;
}) => {
  return (
    <>
      {props.results.map((c, index) => (
        <DraggableCard
          onClick={props.onClick}
          entityID={c.entity}
          key={c.entity}
          hideContent
          selected={index === props.suggestionIndex}
        />
      ))}
    </>
  );
};

const NewCard = (props: { title: string; onClick: () => void }) => {
  let { authorized, mutate, memberEntity } = useMutations();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: "new-search-card" + props.title,
    type: "new-search-card",
    title: props.title,
  });
  let { open } = useCardViewer();
  if (!authorized) return null;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={async () => {
        if (!authorized || !memberEntity) return;
        let entityID = ulid();
        await mutate("createCard", {
          entityID,
          title: props.title,
          memberEntity,
        });
        props.onClick();
        open({ entityID, focus: "content" });
      }}
      className={`touch-none ${isDragging ? `opacity-60` : ""}`}
    >
      <PlaceholderNewCard title={props.title} />
    </div>
  );
};

const DraggableCard = (props: {
  onClick?: () => void;
  selected?: boolean;
  editable?: boolean;
  entityID: string;
  hideContent?: boolean;
  width?: string;
}) => {
  let data = useCardPreviewData(props.entityID);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: props.entityID,
    data: data,
    type: "search-card",
    entityID: props.entityID,
  });
  let ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (props.selected) ref.current?.scrollIntoView({ block: "center" });
  }, [props.selected]);

  return (
    <div
      ref={ref}
      className={`${props.selected ? " bg-bg-blue" : ""} px-2 py-1`}
    >
      <div ref={setNodeRef} className={`${isDragging ? ` opacity-60` : ""}`}>
        <CardPreview
          onClick={props.onClick}
          data={data}
          entityID={props.entityID}
          size="big"
          editable={props.editable}
          dragHandleProps={{ listeners, attributes }}
          hideContent={props.hideContent}
        />
      </div>
    </div>
  );
};

export const MobileSearch = () => {
  let { input, setInput, results, exactMatch } = useSearch();
  let [state, setState] = useState<"normal" | "open">("normal");
  let [measure, { height }] = useMeasure();
  let style = useSpring({
    y: state === "open" ? -1 * height + 39 : 38,
  });
  let opacity = useSpring({
    opacity: state === "open" ? 0.2 : 0,
  });

  let { setNodeRef: drawerDroppableRef } = useDroppableZone({
    disabled: state !== "open",
    id: "mobile-search-drawer",
    entityID: "",
    onDragEnter: () => {
      setState("normal");
    },
    type: "dropzone",
  });
  let refCombined = useCombinedRefs(measure);
  let inputRef = useRef<HTMLInputElement>(null);

  const bindOverlay = useGesture({
    onDrag: (data) => {
      if (data.direction[1] > 0) {
        inputRef.current?.blur();
        setState("normal");
      }
    },
  });
  let viewportHeight = useViewportSize().height;

  return (
    <>
      <button
        className="flex h-8 w-8 items-center justify-center rounded-md border border-grey-55"
        onClick={() => {
          setState("open");
          inputRef.current?.focus();
        }}
      >
        <SearchSmall />
      </button>
      {state === "open" && (
        <>
          <animated.div
            {...bindOverlay()}
            onClick={() => setState("normal")}
            className="fixed inset-0 z-50 bg-grey-15"
            style={opacity}
          />
          <div
            style={{ height: viewportHeight * 0.45 }}
            ref={drawerDroppableRef}
            className="fixed inset-0 z-40"
          />
        </>
      )}
      <animated.div className="fixed left-0 z-50 w-full px-2" style={style}>
        <div
          style={{ height: viewportHeight * 0.5 }}
          className="no-scrollbar relative z-0 flex  w-full flex-col gap-2 overflow-y-scroll rounded-md border border-b-0 border-grey-90 bg-white pt-2"
          ref={refCombined}
        >
          <div className="sticky top-0 z-10 flex flex-row justify-between gap-2 px-2">
            <div className="relative w-full">
              <RoomSearch className="absolute right-2 top-2 text-grey-55" />
              <input
                className={`w-full px-2 py-1 outline-none`}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setState("normal");
                    e.currentTarget.blur();
                  }
                }}
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="search cards..."
              />
            </div>
            <button onClick={() => setState("normal")} className="text-grey-15">
              <CloseLinedTiny />
            </button>
          </div>
          <div className="flex flex-col">
            {input.length > 0 &&
              results.map((c) => (
                <DraggableCard
                  entityID={c.entity}
                  key={c.entity}
                  hideContent
                  onClick={() => {
                    inputRef.current?.blur();
                    setState("normal");
                  }}
                />
              ))}
            {input && !exactMatch && (
              <div className="p-2">
                <NewCard title={input} onClick={() => setState("normal")} />
              </div>
            )}
          </div>
        </div>
      </animated.div>
    </>
  );
};
