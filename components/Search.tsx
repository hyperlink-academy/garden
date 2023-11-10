import { db } from "hooks/useReplicache";
import { useEffect, useRef, useState } from "react";
import { CardPreview } from "./CardPreview";
import * as Popover from "@radix-ui/react-popover";
import { useCardPreviewData } from "hooks/CardPreviewData";
import { useIsElementOrChildFocused } from "hooks/utils";
import { useDraggableCard, useDroppableZone } from "./DragContext";
import { CloseLinedTiny, RoomSearch } from "./Icons";
import { animated, useSpring } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { useCombinedRefs } from "./Desktop";
import { focusElement } from "src/utils";

export function Search() {
  let [input, setInput] = useState("");
  let cards = db.useAttribute("card/title");
  let results = cards.filter(
    (c) => c.value && (!input || c.value.includes(input))
  );
  let [focused, ref] = useIsElementOrChildFocused();
  return (
    <Popover.Root open>
      <div style={{ width: 420 }}>
        <Popover.Anchor />
        <Popover.Portal>
          <Popover.Content
            ref={ref}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`-mr-4 flex flex-col gap-2 px-2 ${focused
                ? "-mt-2 rounded-md border-grey-90 bg-white py-2 drop-shadow-lg"
                : ""
              }`}
            style={{ width: "var(--radix-popper-anchor-width)" }}
          >
            <div className="relative">
              <RoomSearch className="absolute right-2 top-2 text-grey-55" />
              <input
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                className="w-full px-2 py-1 outline-none"
                placeholder="search cards..."
              />
            </div>
            <div className="flex flex-col gap-1">
              {focused && (
                <div className="flex flex-col gap-2 pb-2 text-grey-55">
                  <p className="text-sm">
                    <i>hold and drag cards to move to room</i>
                  </p>
                  <hr />
                </div>
              )}
              {focused &&
                input.length > 0 &&
                results.map((c) => (
                  <DraggableCard entityID={c.entity} key={c.id} hideContent />
                ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}

const DraggableCard = (props: {
  editable?: boolean;
  entityID: string;
  hideContent?: boolean;
}) => {
  let data = useCardPreviewData(props.entityID);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggableCard({
    id: props.entityID,
    data: data,
    type: "search-card",
    entityID: props.entityID,
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={`flex flex-col pb-2 ${isDragging ? `opacity-60` : ""}`}
      >
        <CardPreview
          data={data}
          entityID={props.entityID}
          size="big"
          editable={props.editable}
          dragHandleProps={{ listeners, attributes }}
          hideContent={props.hideContent}
        />
      </div>
    </>
  );
};

export const MobileSearch = () => {
  let [input, setInput] = useState("");
  let [state, setState] = useState<"normal" | "open" | "dragging">("normal");
  let cards = db.useAttribute("card/title");
  let [measure, { height }] = useMeasure();
  let style = useSpring({
    y: state === "open" ? -1 * height + 39 : state === "dragging" ? -16 : 38,
  });
  let opacity = useSpring({
    opacity: state === "open" ? 0.2 : 0,
  });
  let results = cards.filter(
    (c) => c.value && (!input || c.value.includes(input))
  );
  let [focused, ref] = useIsElementOrChildFocused();
  useEffect(() => {
    if (!focused) {
      setState("normal");
    }
  }, [focused]);

  let { setNodeRef: drawerDroppableRef } = useDroppableZone({
    id: "mobile-search-drawer",
    entityID: "",
    type: "dropzone",
    onDragExit: () => {
      setState("dragging");
    },
    onDragEnter: () => {
      setState("open");
    },
  });
  let refCombined = useCombinedRefs(drawerDroppableRef, measure);
  let inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        onClick={() => {
          setState("open");
          focusElement(inputRef.current);
        }}
      >
        <RoomSearch height={24} width={24} />
      </button>
      {state === "open" && (
        <animated.div
          className="fixed inset-0 z-50 bg-grey-15"
          style={opacity}
        />
      )}
      <animated.div
        className="fixed left-0 z-50 w-full px-2"
        style={style}
        ref={ref}
      >
        <div
          className="relative z-0 flex h-[40vh] w-full flex-col gap-2 overflow-y-scroll rounded-md border border-b-0 border-grey-90 bg-white p-2"
          ref={refCombined}
        >
          <div className="sticky top-0 z-10 flex flex-row justify-between gap-2">
            <div className="relative w-full">
              <RoomSearch className="absolute right-2 top-2 text-grey-55" />
              <input
                className="w-full px-2 py-1 outline-none"
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
          {input.length > 0 &&
            results.map((c) => (
              <DraggableCard entityID={c.entity} key={c.id} hideContent />
            ))}
        </div>
      </animated.div>
    </>
  );
};
