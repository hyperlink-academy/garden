import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
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
import { usePopupCardViewer } from "./PopupCardViewer";

const borderStyles = (args: { isDeck: boolean; isMember: boolean }) => {
  switch (true) {
    //border styles found in global.css
    case args.isMember:
      return "memberCardBorder";
    case args.isDeck:
      return "deckCardBorder";
    default:
      return "defaultCardBorder";
  }
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

type SharedProps = {
  size: "big" | "small";
  onRotateDrag?: (da: number) => void;
  factID?: string;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  onResize?: (size: "big" | "small") => void;
  href: string;
};

export const CardPreview = (
  props: {
    entityID: string;
  } & SharedProps
) => {
  let isDeck = !!useIndex.eav(props.entityID, "deck");
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let image = useIndex.eav(props.entityID, "card/image");

  return (
    <RotateAndResize {...props}>
      <div
        className={`relative grow h-full ${borderStyles({ isDeck, isMember })}`}
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
  Pick<SharedProps, "onResize" | "onRotateDrag" | "size" | "factID">
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
  let { authorized, mutate } = useMutations();

  return (
    <div
      {...bindPinch()}
      ref={ref}
      style={{}}
      className={`
      touch-none
      ${props.size === "small" ? "w-[160px] h-24" : "w-full"}
      grid grid-cols-[auto_min-content] gap-1
      group
      `}
    >
      {props.children}

      {/* Rotate and Resize Handle */}

      <div
        ref={ref}
        className="text-grey-80 flex flex-col justify-between gap-1 pb-1 opacity-0 group-hover:opacity-100"
      >
        <button
          className="hover:text-accent-blue pt-1"
          onClick={() => {
            if (!props.factID) return;
            mutate("retractFact", { id: props.factID });
          }}
        >
          <Cross width={12} height={12} />
        </button>
        <div>
          <div className="leading-3 ">
            {authorized && props.onResize ? (
              <button
                className="hover:text-accent-blue"
                onClick={() =>
                  props.onResize?.(props.size === "big" ? "small" : "big")
                }
              >
                {props.size === "big" ? <MakeSmallHandle /> : <MakeBigHandle />}
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
      {/* End Rotate and Resize Handle */}
    </div>
  );
};

const SmallCardBody = (props: { entityID: string } & SharedProps) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let { open } = usePopupCardViewer();
  let { authorized } = useMutations();

  let member = useIndex.eav(props.entityID, "member/name");
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let image = useIndex.eav(props.entityID, "card/image");
  let url = content?.value ? isUrl(content?.value) : false;

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className={`w-full h-full grid grid-cols-[max-content_auto] !bg-cover !bg-center !bg-no-repeat ${
        isMember ? "pr-1 pl-0 pt-2 pb-1" : "pr-3 pl-0 py-2"
      }`}
      style={{
        background: imageUrl ? `url(${imageUrl})` : "",
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
        <div className={`${isMember ? "pl-1" : "pl-3"}`} />
      )}
      {/* Small Card Preview Content Wrapper (is it default or member?) */}
      {!isMember ? (
        /* Default Content (Member Content Futher DOwn) */
        <div
          className="w-full h-full flex flex-col gap-2 items-stretch overflow-hidden"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preivew Title Or Contnet */}
          <div
            onClick={() => open({ entityID: props.entityID })}
            className="hover:cursor-pointer"
          >
            <a className="h-full overflow-hidden">
              {!title || title?.value === "" ? (
                <small>
                  <pre
                    className={`whitespace-pre-wrap truncate leading-tight ${
                      !image ? "" : "rounded-[3px] px-1 bg-white/75"
                    } `}
                  >
                    {content?.value}
                  </pre>
                </small>
              ) : (
                <div
                  className={`leading-tight text-ellipsis text-grey-35 font-bold  ${
                    !image ? "" : "rounded-[3px] px-1 bg-white/75"
                  }`}
                >
                  {title?.value}
                </div>
              )}
            </a>
          </div>

          {/* Small Card Preview External Link */}
          {url ? (
            <a
              href={content?.value}
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
            <p className="overflow-hidden">{member?.value}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const BigCardBody = (props: { entityID: string } & SharedProps) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let sections = useIndex.eav(props.entityID, "card/section");
  let image = useIndex.eav(props.entityID, "card/image");
  let { authorized } = useMutations();

  let { open } = usePopupCardViewer();

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className="w-full overflow-hidden h-full pr-3 pl-0 py-2 flex flex-row"
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
            isMember
              ? "bg-white rounded-md p-2 pb-0 text-accent-red mt-1 mb-2"
              : ""
          }`}
        >
          {!image ? null : (
            <img
              src={`${imageUrl}`}
              className="py-2 px-1  max-w-full max-h-[600px]"
            />
          )}
          <SingleTextSection
            entityID={props.entityID}
            section="card/content"
            placeholderOnHover={true}
            className={`whitespace-pre-wrap truncate leading-tight pt-1 pb-3 ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          />
        </div>

        {/* Big Card Preview Resize and Rotate */}
        {sections !== null && sections.length === 0 ? (
          <div />
        ) : (
          <small className="SectionCounter text-grey-80 hover:text-accent-blue hover:underline pb-1 ">
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
