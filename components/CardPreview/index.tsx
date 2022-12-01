import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex, useMutations } from "hooks/useReplicache";
import {
  Cross,
  DragRotateHandle,
  MakeBigHandle,
  MakeSmallHandle,
} from "components/Icons";
import { useDrag, usePinch } from "@use-gesture/react";
import { useRef } from "react";
import { SmallCardBody } from "./SmallCard";
import { BigCardBody } from "./BigCard";

const borderStyles = (args: {
  isDeck: boolean;
  isMember: boolean;
  isChat: boolean;
}) => {
  switch (true) {
    //border styles found in global.css
    case args.isMember:
      return "memberCardBorder";
    case args.isDeck:
      return "defaultCardBorder";
    case args.isChat:
      return "chatCardBorder";
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
};

export const CardPreview = (
  props: {
    entityID: string;
  } & Props
) => {
  let isDeck = !!useIndex.eav(props.entityID, "deck");
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let isChat = !!useIndex.eav(props.entityID, "chat");

  return (
    <RotateAndResize {...props}>
      <div
        className={`cardPreviewBorder relative grow overflow-hidden ${borderStyles(
          {
            isDeck,
            isMember,
            isChat,
          }
        )} ${props.isOver ? "rounded-[24px] shadow-[0_0_16px_0_#cccccc]" : ""}`}
      >
        {props.size === "small" ? (
          <SmallCardBody {...props} />
        ) : (
          <BigCardBody {...props} />
        )}
      </div>
    </RotateAndResize>
  );
};

export const RotateAndResize: React.FC<
  Pick<Props, "onResize" | "onRotateDrag" | "size" | "factID" | "onDelete">
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
      ${props.size === "small" ? "w-[160px] h-[6rem]" : "w-full"}
      grid grid-cols-[auto_min-content] gap-1 
      h-full
      group
      `}
    >
      {props.children}

      {/* Rotate and Resize Handle */}

      {props.onDelete || props.onResize || props.onRotateDrag ? (
        <div
          ref={ref}
          className="text-grey-80 flex flex-col justify-between gap-1 pb-1 opacity-0 group-hover:opacity-100 z-50"
        >
          {props.onDelete ? (
            <button
              className="hover:text-accent-blue pt-1 z-50"
              onClick={() => {
                props.onDelete?.();
              }}
            >
              <Cross width={12} height={12} />
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
              <div {...bind()} className="touch-none hover:text-accent-blue  ">
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
