import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { SingleTextSection } from "./CardView/Sections";
import { GripperBG } from "./Gripper";
import {
  Cross,
  DragRotateHandle,
  ExternalLink,
  GoToPage,
  MakeBigHandle,
  MakeSmallHandle,
  Member,
} from "./Icons";
import { useDrag, usePinch } from "@use-gesture/react";
import { isUrl } from "src/isUrl";
import { useRef } from "react";
import { useCardViewer } from "./CardViewer";
import { useReadState } from "hooks/useReadState";
import { useAuth } from "hooks/useAuth";

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
      return "deckCardBorder";
    case args.isChat:
      return "chatCardBorder";
    default:
      return "defaultCardBorder";
  }
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

type SharedProps = {
  size: "big" | "small";
  onRotateDrag?: (da: number) => void;
  onDelete?: () => void;
  factID?: string;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  onResize?: (size: "big" | "small") => void;
  href: string;
  isOver?: boolean;
};

export const CardPreview = (
  props: {
    entityID: string;
  } & SharedProps
) => {
  let isDeck = !!useIndex.eav(props.entityID, "deck");
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let isChat = !!useIndex.eav(props.entityID, "chat");
  let image = useIndex.eav(props.entityID, "card/image");

  return (
    <RotateAndResize {...props}>
      <div
        className={`relative grow h-full ${borderStyles({
          isDeck,
          isMember,
          isChat,
        })} ${
          props.isOver ? "rounded-[24px] shadow-[0_0_16px_0_#cccccc]" : ""
        }`}
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
  Pick<
    SharedProps,
    "onResize" | "onRotateDrag" | "size" | "factID" | "onDelete"
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
      ${props.size === "small" ? "w-[160px] min-h-[6rem]" : "w-full"}
      grid grid-cols-[auto_min-content] gap-1
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

const SmallCardBody = (props: { entityID: string } & SharedProps) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let read = useReadState(props.entityID);
  let { open } = useCardViewer();
  let { authorized } = useMutations();

  let member = useIndex.eav(props.entityID, "member/name");
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let image = useIndex.eav(props.entityID, "card/image");

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <BaseSmallCard
      {...props}
      title={title?.value}
      content={content?.value}
      imageUrl={imageUrl}
      isMember={isMember}
      read={read}
      memberName={member?.value}
    />
  );
};

export const BaseSmallCard = (
  props: {
    title?: string;
    image?: string;
    memberName?: string;
    content?: string;
    isMember: boolean;
    imageUrl?: string;
    entityID?: string;
    read: boolean;
  } & Omit<SharedProps, "size" | "href">
) => {
  let url = props.content ? isUrl(props.content) : false;
  let { authorized } = useMutations();
  let { open } = useCardViewer();
  return (
    <div
      onClick={() => props.entityID && open({ entityID: props.entityID })}
      className={`w-full h-full grid grid-cols-[max-content_auto] !bg-cover !bg-center !bg-no-repeat hover:cursor-pointer ${
        props.isMember ? "pr-1 pl-0 pt-2 pb-1" : "pr-3 pl-0 py-2"
      }`}
      style={{
        background: props.imageUrl ? `url(${props.imageUrl})` : "",
      }}
    >
      {authorized && props.dragHandleProps ? (
        <div
          className="gripper group pl-1 pr-2"
          {...props.dragHandleProps.attributes}
          {...props.dragHandleProps.listeners}
        >
          <GripperBG />
        </div>
      ) : (
        <div className={`${props.isMember ? "pl-1" : "pl-3"}`} />
      )}
      {/* Small Card Preview Content Wrapper (is it default or member?) */}
      {!props.isMember ? (
        /* Default Content (Member Content Futher DOwn) */
        <div
          className="w-full h-full flex flex-col gap-2 items-stretch overflow-hidden"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preivew Title Or Contnet */}
          <a className="h-full overflow-hidden">
            {!props.title ? (
              <small>
                <pre
                  className={`whitespace-pre-wrap truncate leading-tight ${
                    !props.image ? "" : "rounded-[3px] px-1 bg-white/75"
                  } `}
                >
                  {props?.content}
                </pre>
              </small>
            ) : (
              <div
                className={`leading-tight text-ellipsis text-grey-35 font-bold  ${
                  !props.image ? "" : "rounded-[3px] px-1 bg-white/75"
                }`}
              >
                {props.title}
              </div>
            )}
            {!props.read ? (
              <div className="rounded-full bg-accent-red w-1 h-1" />
            ) : null}
          </a>

          {/* Small Card Preview External Link */}
          {url ? (
            <a
              href={props.content}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="text-accent-blue ">
                <ExternalLink />
              </div>
            </a>
          ) : (
            <div />
          )}
        </div>
      ) : (
        // END OF DEFAULT CARD CONTENT, START OF MEMBER CARD CONTENT
        <div className="w-full h-full flex flex-col gap-2 items-stretch overflow-hidden">
          <div className="grid grid-cols-[auto_max-content] items-end text-white ">
            <Member />
            <small>member</small>
          </div>
          <div
            className={`
            py-1 px-2 
            grow
            bg-white rounded-md 
            text-accent-red font-bold leading-tight 
            h-full overflow-y-hidden
            flex items-end
            `}
          >
            <p className="overflow-hidden">{props.memberName}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const BigCardBody = (props: { entityID: string } & SharedProps) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let { session } = useAuth();
  let spaceID = useSpaceID();
  let sections = useIndex.eav(props.entityID, "card/section");
  let image = useIndex.eav(props.entityID, "card/image");
  let { mutate, authorized } = useMutations();

  let { open } = useCardViewer();

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className={`w-full overflow-hidden h-full flex flex-row pl-0  ${
        isMember ? "py-2 pr-2" : "py-2 pr-3"
      }`}
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      {/* Gripper  */}
      <div className="pl-1 pr-2 text-grey-80">
        {authorized && props.dragHandleProps ? (
          <div className="h-full">
            <GripperBG
              {...props.dragHandleProps.attributes}
              {...props.dragHandleProps.listeners}
            />
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Big Card Preview Content Wrapper */}
      <div className="grid grid-rows-[max-content_auto_max-content] w-full">
        {/* Big Card Preview Title and GoTo Button*/}
        <div className={`flex gap-2 items-start`}>
          <SingleTextSection
            entityID={props.entityID}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                let element = document.getElementById(
                  `${props.entityID}-${props.factID}-text-section`
                );
                element?.focus();
              }
            }}
            previewOnly={isMember}
            section={isMember ? "member/name" : "card/title"}
            placeholderOnHover={true}
            placeholder="Untitled"
            className={`font-bold text-md grow ${
              isMember ? "text-white" : "text-grey-35"
            } ${!image ? "" : "rounded-[3px] px-1 bg-white/75"}`}
          />
          {isMember ? <div className="shrink-0 text-white">member</div> : ""}
          <div
            onClick={() => open({ entityID: props.entityID })}
            className="hover:cursor-pointer pt-1"
          >
            <a className={`${isMember ? "text-white" : "text-accent-blue"}`}>
              <GoToPage />
            </a>
          </div>
        </div>

        {/* Big Card Preview Default Content */}
        <div
          className={`${
            isMember ? "bg-white rounded-md p-2 pt-1 text-accent-red mt-1" : ""
          }`}
        >
          {!image ? null : (
            <img
              src={`${imageUrl}`}
              className="py-2 px-1  max-w-full max-h-[600px]"
            />
          )}
          <SingleTextSection
            id={`${props.entityID}-${props.factID}-text-section`}
            entityID={props.entityID}
            onPaste={async (e) => {
              let items = e.clipboardData.items;
              if (!items[0].type.includes("image") || !session.session) return;
              let image = items[0].getAsFile();
              if (!image) return;

              let res = await fetch(
                `${WORKER_URL}/space/${spaceID}/upload_file`,
                {
                  headers: {
                    "X-Authorization": session.session.id,
                  },
                  method: "POST",
                  body: image,
                }
              );
              let data = (await res.json()) as
                | { success: false }
                | { success: true; data: { id: string } };
              if (!data.success) return;
              await mutate("assertFact", {
                entity: props.entityID,
                attribute: "card/image",
                value: { type: "file", id: data.data.id, filetype: "image" },
                positions: {},
              });
            }}
            section="card/content"
            placeholderOnHover={true}
            className={`whitespace-pre-wrap truncate leading-tight pt-1  ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          />
        </div>

        {/* Big Card Preview Resize and Rotate */}
        {sections !== null && sections.length === 0 ? (
          <div />
        ) : (
          <small
            className={`SectionCounter text-grey-80 ${
              isMember ? "hover:text-white" : "hover:text-accent-blue"
            } hover:underline pb-1 pt-2 `}
          >
            <a onClick={() => open({ entityID: props.entityID })}>
              + {sections?.length} sections
            </a>
          </small>
        )}
      </div>
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
