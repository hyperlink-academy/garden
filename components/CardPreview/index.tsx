import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { scanIndex, db, useMutations, useSpaceID } from "hooks/useReplicache";
import {
  ChatEmptyTiny,
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
import { useSubscribe } from "hooks/useSubscribe";
import { useAuth } from "hooks/useAuth";
import { ulid } from "src/ulid";
import { getAndUploadFile } from "src/getAndUploadFile";
import { CardPreviewData, useCardPreviewData } from "hooks/CardPreviewData";
import { useUIState } from "hooks/useUIState";
import { PresenceTag } from "components/PresenceTag";

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
  parent: string | null;
  onRotateDrag?: (da: number) => void;
  onDelete?: () => void;
  onClick?: () => void;
  outerControls?: boolean;
  hideContent?: boolean;
  editable?: boolean;
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
  data: CardPreviewData;
};

export const CardPreview = (
  props: {
    entityID: string;
  } & Props
) => {
  let isMember = !!db.useEntity(props.entityID, "member/name");
  let { memberEntity, mutate } = useMutations();
  let unreadBy = db.useEntity(props.entityID, "card/unread-by") || [];
  let isUnread = unreadBy.find((f) => f.value.value === memberEntity);
  let { authToken } = useAuth();
  let spaceID = useSpaceID();
  let unreadDiscussions = useSubscribe(
    async (tx) => {
      if (!memberEntity) return false;
      // NB - currently collections also use 'desktop/contains'
      let unread = (
        await scanIndex(tx).eav(props.entityID, "discussion/unread-by")
      ).find((f) => f.value.value === memberEntity);
      if (unread) return true;
      return false;
    },
    false,
    [memberEntity, props.entityID]
  );
  let editing = useUIState((s) => s.focusedCard === props.entityID);

  let messagesCount = db.useMessages(props.entityID).length;

  let { handlers, isLongPress } = useLongPress(
    () => props.onLongPress?.(),
    props.isDragging
  );

  return (
    <HoverControls {...props}>
      <PresenceTag
        entityID={props.entityID}
        size={props.size}
        outerControls={!!!props.outerControls}
      />
      <div
        {...handlers}
        onPointerUp={(e) => {
          if (!isLongPress.current) props.pointerUpHandler?.(e);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          props.onClick?.();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!authToken || !spaceID) return;
          let data = await getAndUploadFile(
            e.dataTransfer.items,
            authToken,
            spaceID
          );
          for (let image of data) {
            if (!image.success) continue;
            await mutate("assertFact", {
              entity: props.entityID,
              factID: ulid(),
              attribute: "card/image",
              value: { type: "file", id: image.data.id, filetype: "image" },
              positions: {},
            });
          }
        }}
        className={`cardPreviewBorder select-none ${
          isUnread ? "unreadCardGlow" : ""
        } relative grow overflow-hidden ${borderStyles({ isMember })} ${
          props.isSelected || (editing && !isMember) ? "selectedCardGlow" : ""
        } ${props.isOver ? "rounded-[24px] shadow-[0_0_16px_0_#cccccc]" : ""}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {props.size === "small" ? (
          <SmallCardBody
            {...props}
            unreadDiscussions={unreadDiscussions}
            messagesCount={messagesCount}
          />
        ) : (
          <BigCardBody
            {...props}
            unreadDiscussions={unreadDiscussions}
            messagesCount={messagesCount}
          />
        )}
      </div>
    </HoverControls>
  );
};

export const HoverControls = (
  props: Pick<
    Props,
    | "onResize"
    | "onRotateDrag"
    | "size"
    | "factID"
    | "onDelete"
    | "outerControls"
  > & { children: React.ReactNode }
) => {
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
      relative
      ${props.size === "small" ? "h-[6rem] w-[160px]" : "h-full w-full"}
      group grid
      grid-cols-[auto_min-content]
      ${props.outerControls ? "gap-1" : ""}
      `}
    >
      {props.children}

      {/* Rotate and Resize Handle */}

      {authorized && !props.outerControls ? null : (authorized &&
          props.onDelete) ||
        (authorized && props.onResize) ||
        (authorized && props.onRotateDrag) ? (
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
      ) : props.size == "big" ? null : (
        // spacer for small card only, to maintain consistent size
        // NOT for big card e.g. in collection, so card spans full width
        <div className="w-[12px]"> </div>
      )}
      {/* End Rotate and Resize Handle */}
    </div>
  );
};

export const PlaceholderNewCard = (props: { title: string }) => {
  return (
    <div className="searchNewCard flex flex-col gap-2 rounded-md border border-dashed border-accent-blue bg-white p-2 text-accent-blue">
      <p className="text-base font-bold">{props.title}</p>
      <div className="flex flex-row gap-2">
        <ChatEmptyTiny /> 0
      </div>
    </div>
  );
};

export const CardPreviewWithData = (
  props: {
    entityID: string;
  } & Omit<Props, "data"> & { focusText?: string }
) => {
  let data = useCardPreviewData(props.entityID);
  return <CardPreview {...props} data={data} />;
};

type P = { x: number; y: number };
function find_angle(P2: P, P1: P, P3: P) {
  if (P1.x === P3.x && P1.y === P3.y) return 0;
  let a = Math.atan2(P3.y - P1.y, P3.x - P1.x);
  let b = Math.atan2(P2.y - P1.y, P2.x - P1.x);
  return a - b;
}
