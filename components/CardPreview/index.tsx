import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex, useMutations } from "hooks/useReplicache";
import {
  CloseLinedTiny,
  DragRotateHandle,
  MakeBigHandle,
  MakeSmallHandle,
} from "components/Icons";
import { useDrag, usePinch } from "@use-gesture/react";
import { useRef } from "react";
import { SmallCardBody } from "./SmallCard";
import { BigCardBody } from "./BigCard";
import { useLongPress } from "hooks/useLongPress";

const borderStyles = (args: { isMember: boolean }) => {
  switch (true) {
    //border styles found in global.css
    case args.isMember:
      return "memberCardBorder";
    default:
      return "defaultCardBorder";
  }
};

export type Props = {
  size: "big" | "small";
  onRotateDrag?: (da: number) => void;
  onDelete?: () => void;
  factID?: string;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  onResize?: (size: "big" | "small") => void;
  showRelated?: boolean;
  isOver?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  isDragging?: boolean;
  onLongPress?: () => void;
  pointerUpHandler?: (e: React.PointerEvent) => void;
};

export const CardPreview = (
  props: {
    entityID: string;
  } & Props
) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let { memberEntity } = useMutations();
  let unreadBy = useIndex.eav(props.entityID, "card/unread-by") || [];
  let isUnread = unreadBy.find((f) => f.value.value === memberEntity);

  let { handlers, isLongPress } = useLongPress(
    () => props.onLongPress?.(),
    props.isDragging
  );

  return (
    <HoverControls {...props}>
      <div
        {...handlers}
        onPointerUp={(e) => {
          if (!isLongPress.current) props.pointerUpHandler?.(e);
        }}
        className={`cardPreviewBorder select-none ${
          isUnread ? "unreadCardGlow" : ""
        } relative grow overflow-hidden ${borderStyles({ isMember })} ${
          props.isSelected ? "selectedCardGlow" : ""
        } ${props.isOver ? "rounded-[24px] shadow-[0_0_16px_0_#cccccc]" : ""}`}
      >
        {props.size === "small" ? (
          <SmallCardBody {...props} />
        ) : (
          <BigCardBody {...props} />
        )}
      </div>
    </HoverControls>
  );
};

export const HoverControls: React.FC<
  React.PropsWithChildren<
    Pick<Props, "onResize" | "onRotateDrag" | "size" | "factID" | "onDelete">
  >
> = (props) => {
  let ref = useRef<null | HTMLDivElement>(null);
  let bindPinch = usePinch(
    ({ da, memo, first }) => {
      if (first) return [memo ? memo[0] : da[0], da[1]];
      if (da[0] - memo[0] > 50) props.onResize?.("big");
      if (memo[0] - da[0] > 50) props.onResize?.("small");
      props.onRotateDrag?.((da[1] - memo[1]) * (Math.PI / 180));
      return [memo ? memo[0] : da[0], da[1]];
    },
    { preventDefault: true, filterTaps: true }
  );
  let bind = useDrag(({ initial, xy, memo }) => {
    if (!ref.current) return;
    let rect = ref.current.getBoundingClientRect();
    memo = memo || 0;

    let originX = rect.x + rect.width / 2;
    let originY = rect.y + rect.height / 2;

    let angle = find_angle(
      { x: initial[0], y: initial[1] },
      { x: originX, y: originY },
      { x: xy[0], y: xy[1] }
    );
    props.onRotateDrag?.(angle - memo);
    return angle;
  });
  let { authorized } = useMutations();

  return (
    <div
      {...bindPinch()}
      ref={ref}
      style={{}}
      className={`
      cardPreviewWrapper
      ${props.size === "small" ? "h-[6rem] w-[160px]" : "w-full"}
      group grid h-full 
      grid-cols-[auto_min-content]
      gap-1
      `}
    >
      {props.children}

      {/* Rotate and Resize Handle */}

      {authorized &&
      (props.onDelete || props.onResize || props.onRotateDrag) ? (
        <div className="z-50 flex flex-col justify-between gap-1 pb-1 text-grey-80 opacity-0 group-hover:opacity-100">
          {authorized && props.onDelete ? (
            <button
              className="z-50 pt-1 hover:text-accent-blue"
              onClick={() => {
                props.onDelete?.();
              }}
            >
              <CloseLinedTiny width={12} height={12} />
            </button>
          ) : null}
          <div>
            <div className="leading-3 ">
              {authorized && props.onResize ? (
                <button
                  className="hover:text-accent-blue"
                  onClick={() =>
                    props.onResize?.(props.size === "big" ? "small" : "big")
                  }
                >
                  {props.size === "big" ? (
                    <MakeSmallHandle />
                  ) : (
                    <MakeBigHandle />
                  )}
                </button>
              ) : (
                <div className="w-[12px]" />
              )}
            </div>

            {authorized && props.onRotateDrag && (
              <div
                {...bind()}
                className="touch-none hover:text-accent-blue"
                style={{ cursor: "pointer" }}
              >
                <DragRotateHandle />
              </div>
            )}
          </div>
        </div>
      ) : null}
      {/* End Rotate and Resize Handle */}
    </div>
  );
};

type P = { x: number; y: number };
function find_angle(P2: P, P1: P, P3: P) {
  if (P1.x === P3.x && P1.y === P3.y) return 0;
  let a = Math.atan2(P3.y - P1.y, P3.x - P1.x);
  let b = Math.atan2(P2.y - P1.y, P2.x - P1.x);
  return a - b;
}
