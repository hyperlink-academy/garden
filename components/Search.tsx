import { db, scanIndex, useMutations } from "hooks/useReplicache";
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
import { Divider } from "./Layout";
import { useCurrentOpenCard, useOpenCard, useRoom } from "hooks/useUIState";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";

let useSearch = () => {
  let [input, setInput] = useState("");
  let cards = db.useAttribute("card/title");
  let results = cards.filter(
    (c) =>
      c.value &&
      input.length > 0 &&
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
  let [render, setRender] = useState(false);
  useEffect(() => {
    setRender(true);
  }, []);
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
  let [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  useEffect(() => {
    setOpen(focused);
  }, [focused]);
  let { setNodeRef: drawerDroppableRef } = useDroppableZone({
    id: "search-popover",
    entityID: "",
    type: "search",
  });
  let combinedRefs = useCombinedRefs(ref, drawerDroppableRef);
  let { authorized, mutate, memberEntity, rep } = useMutations();
  let room = useRoom();
  let currentOpenCard = useCurrentOpenCard();
  let roomType = db.useEntity(room, "room/type");
  if (!render) return null;

  return (
    <Popover.Root open>
      <div className="w-full">
        {/* this transparent anchor is a hack, but you need some content in the div to ensure that the popover positions itself correctly on page load */}
        <Popover.Anchor className="h-8 text-transparent">.</Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={-40}
            ref={combinedRefs}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`no-scrollbar relative z-0 flex max-h-80 flex-col gap-1 overflow-x-scroll rounded-md border pb-1 text-sm ${
              open
                ? " border-grey-90 bg-white shadow-drop"
                : "border-transparent"
            }`}
            style={{ width: "var(--radix-popper-anchor-width)" }}
          >
            <div
              className={`sticky top-0 z-20  px-2 pt-2  ${
                open && " bg-white"
              } `}
            >
              <RoomSearch className={`absolute right-4 top-4 text-grey-55`} />
              <input
                ref={inputRef}
                tabIndex={-1}
                onKeyDown={async (e) => {
                  let target = e.currentTarget;
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                  if (e.key === "Enter") {
                    //New Card
                    e.preventDefault();
                    let entityID: string;
                    if (suggestionIndex === results.length && !exactMatch) {
                      if (!authorized || !memberEntity) return;
                      entityID = ulid();
                      await mutate("createCard", {
                        entityID,
                        title: input,
                        memberEntity,
                      });
                    } else {
                      entityID = results[suggestionIndex].entity;
                    }
                    if (e.ctrlKey || e.metaKey) {
                      if (e.shiftKey && currentOpenCard) {
                        if (!rep) return;
                        let siblings = (
                          await rep.query((tx) => {
                            return scanIndex(tx).eav(room, "deck/contains");
                          })
                        ).sort(sortByPosition("eav"));
                        let newIndex = siblings.length - 1;
                        let position = generateKeyBetween(
                          siblings[newIndex]?.positions.eav || null,
                          siblings[newIndex + 1]?.positions.eav || null
                        );

                        await mutate("addCardToSection", {
                          factID: ulid(),
                          cardEntity: entityID,
                          parent: currentOpenCard,
                          section: "deck/contains",
                          positions: {
                            eav: position,
                          },
                        });
                        setOpen(false);
                        target.blur();
                        return;
                      }
                      if (!roomType || !rep) return;
                      if (roomType.value === "chat") return;
                      if (roomType.value === "collection") {
                        let siblings = (
                          await rep.query((tx) => {
                            return scanIndex(tx).eav(room, "desktop/contains");
                          })
                        ).sort(sortByPosition("eav"));
                        let newIndex = siblings.length - 1;
                        let position = generateKeyBetween(
                          siblings[newIndex]?.positions.eav || null,
                          siblings[newIndex + 1]?.positions.eav || null
                        );

                        await mutate("addCardToSection", {
                          factID: ulid(),
                          cardEntity: entityID,
                          parent: room,
                          section: "desktop/contains",
                          positions: {
                            eav: position,
                          },
                        });
                        let roomElement =
                          document.getElementById("room-wrapper");
                        roomElement?.scrollTo({
                          top: roomElement.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                      if (roomType.value === "canvas") {
                        let positions = await rep.query(async (tx) => {
                          return await Promise.all(
                            (
                              await scanIndex(tx).eav(room, "desktop/contains")
                            ).map(async (c) =>
                              scanIndex(tx).eav(c.id, "card/position-in")
                            )
                          );
                        });
                        let lowestCard = positions.reduce((acc, val) => {
                          return val && val.value.y > acc ? val.value.y : acc;
                        }, 0);
                        await mutate("addCardToDesktop", {
                          entity: entityID,
                          factID: ulid(),
                          desktop: room,
                          position: {
                            rotation: 0,
                            size: "small",
                            x: 64,
                            y: lowestCard === 0 ? 32 : lowestCard + 124,
                          },
                        });
                        let roomElement =
                          document.getElementById("room-wrapper");
                        roomElement?.scrollTo({
                          top: lowestCard,
                          behavior: "smooth",
                        });
                      }
                    } else {
                      openCard({ entityID, focus: "content" });
                    }
                    target.blur();
                    setOpen(false);
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
                className={`w-full px-2 py-1 outline-none ${
                  open && "bg-white"
                }`}
                placeholder="search cards (ctrl/⌘ K)"
                onFocus={(e) =>
                  e.currentTarget.setSelectionRange(
                    0,
                    e.currentTarget.value.length
                  )
                }
              />
              {open && (
                <div className="flex flex-col gap-1 pt-2 text-grey-55">
                  <div className="flex w-full items-start justify-between text-xs">
                    {shortcutHelpOpen ? (
                      <div className="flex flex-col gap-1 italic">
                        <div className="flex gap-2">
                          <div className="flex gap-0.5">
                            <UnicodeKeyboardKey>↑</UnicodeKeyboardKey>
                            <UnicodeKeyboardKey>↓</UnicodeKeyboardKey>
                          </div>
                          select, <UnicodeKeyboardKey>⏎</UnicodeKeyboardKey>
                          open
                        </div>
                        <div className="flex gap-2">
                          <div className="flex gap-0.5">
                            <KeyboardKey>ctrl</KeyboardKey>
                            <UnicodeKeyboardKey>⏎</UnicodeKeyboardKey>
                          </div>
                          place in current room
                        </div>
                        <div className="flex gap-2">
                          <div className="flex gap-0.5">
                            <UnicodeKeyboardKey>⇧</UnicodeKeyboardKey>
                            <KeyboardKey>ctrl</KeyboardKey>
                            <UnicodeKeyboardKey>⏎</UnicodeKeyboardKey>
                          </div>
                          place on current card
                        </div>
                      </div>
                    ) : (
                      <i>click to open, drag to place in space</i>
                    )}
                    <button
                      className="text-accent-blue"
                      onClick={(e) => {
                        setShortcutHelpOpen(!shortcutHelpOpen);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                    >
                      {shortcutHelpOpen ? "close" : "shortcuts"}
                    </button>
                  </div>
                  {input && results.length > 0 && <Divider />}
                </div>
              )}
            </div>
            <div className="z-10 flex w-full flex-col">
              {open && input.length > 0 ? (
                <SearchResults
                  onClick={() => setOpen(false)}
                  results={results}
                  suggestionIndex={suggestionIndex}
                />
              ) : !authorized && input.length > 3 ? (
                <SearchResults
                  onClick={() => setOpen(false)}
                  results={results}
                  suggestionIndex={suggestionIndex}
                />
              ) : null}
              {open && input && !exactMatch && authorized && (
                <div
                  className={`px-2 py-1 ${
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

const KeyboardKey = (props: { children: React.ReactNode }) => {
  return (
    <code className=" flex h-4 w-fit min-w-[16px] justify-center rounded-md border border-grey-80 bg-background px-1 text-center text-[10px] not-italic text-grey-55 ">
      {props.children}
    </code>
  );
};

const UnicodeKeyboardKey = (props: { children: React.ReactNode }) => {
  return (
    <code className=" flex h-4 w-fit min-w-[16px] justify-center rounded-md border border-grey-80 bg-background text-center font-sans text-[10px] not-italic text-grey-55 ">
      <div className="-mt-[1px]"> {props.children}</div>
    </code>
  );
};

const NewCard = (props: { title: string; onClick: () => void }) => {
  let { authorized, mutate, memberEntity } = useMutations();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: "new-search-card" + props.title,
    type: "new-search-card",
    size: "big",
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
    size: "big",
    entityID: props.entityID,
    onDragEnd: (over) => {
      if (over.type === "search") return;
      props.onClick?.();
    },
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
    y: state === "open" ? -1 * height + 39 : 200,
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
    type: "search",
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
        className="mobileSearchTrigger flex h-8 w-8 items-center justify-center rounded-md border border-grey-55"
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
            className="mobileSearchOverlay fixed inset-0 z-50 bg-grey-15"
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
          className="mobileSearchDrawer no-scrollbar relative z-0 flex  w-full flex-col gap-2 overflow-y-scroll rounded-md border border-b-0 border-grey-90 bg-white pt-2"
          ref={refCombined}
        >
          <div className="mobileSearchInput sticky top-0 z-10 flex flex-row justify-between gap-2 px-2">
            <div className="relative w-full">
              <RoomSearch className="absolute right-2 top-2 text-grey-55" />
              <input
                className={`w-full py-1 pl-2 pr-7  outline-none`}
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
          <div className="mobileSearchResults flex flex-col">
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
              <div className="mobileSearchNewCard p-2">
                <NewCard title={input} onClick={() => setState("normal")} />
              </div>
            )}
          </div>
        </div>
      </animated.div>
    </>
  );
};
