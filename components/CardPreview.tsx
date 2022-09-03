import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { SingleTextSection } from "./CardView/Sections";
import { GripperBG } from "./Gripper";
import {
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
      <div className={`relative h-full ${borderStyles({ isDeck, isMember })}`}>
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
  Pick<SharedProps, "onResize" | "onRotateDrag" | "size">
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

  return (
    <div
      {...bindPinch()}
      ref={ref}
      style={{}}
      className={`
      touch-none
      grid grid-cols-[auto_max-content] items-end gap-1
      group
      ${props.size === "small" ? "w-[167px] h-24" : "w-[300px] h-fit"}`}
    >
      {props.children}
      <div
        ref={ref}
        className="text-grey-80 grid grid-rows-2 gap-1 pb-1 opacity-0 group-hover:opacity-100"
      >
        <div className="leading-3 ">
          {props.onResize ? (
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

        {props.onRotateDrag && (
          <div {...bind()} className="touch-none hover:text-accent-blue  ">
            <DragRotateHandle />
          </div>
        )}
      </div>
    </div>
  );
};

const SmallCardBody = (props: { entityID: string } & SharedProps) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");

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
      className={`grid grid-cols-[max-content_auto] h-full !bg-cover !bg-center !bg-no-repeat ${
        isMember ? "pr-1 pl-0 pt-2 pb-1" : "pr-3 pl-0 py-2"
      }`}
      style={{
        background: imageUrl ? `url(${imageUrl})` : "",
      }}
    >
      {}
      {props.dragHandleProps ? (
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
          className=" w-full h-full items-stretch overflow-hidden flex flex-col gap-2"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preivew Title Or Contnet */}
          <Link href={props.href}>
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
          </Link>

          {/* Small Card Preview External Link, Rotate, Resize */}
          <div className="grid grid-cols-[auto_max-content_max-content] items-center text-right w-full gap-2 place-self-end text-grey-80 ">
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
        </div>
      ) : (
        <div className="h-full grid gap-1 grid-rows-[min-content,auto]">
          <div className="grid grid-cols-[auto_max-content] items-end text-white">
            <Member />
            <small>member</small>
          </div>
          <div className="w-full bg-white rounded-md text-accent-red font-bold py-1 px-2 leading-tight  overflow-hidden">
            PBBBBBT
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
        {props.dragHandleProps ? (
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
        {/* Big Card Preview Title */}
        <div className="grid grid-cols-[auto_max-content] items-center">
          <SingleTextSection
            entityID={props.entityID}
            section={isMember ? "member/name" : "card/title"}
            placeholderOnHover={true}
            placeholder="Untitled"
            className={`font-bold text-md text-grey-35 ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            }`}
          />
          <Link href={props.href}>
            <a className="text-accent-blue justify-end ">
              <GoToPage />
            </a>
          </Link>
        </div>

        {/* Big Card Preview Default Content */}
        <div>
          {!image ? null : (
            <img
              src={`${imageUrl}`}
              className="py-1 max-w-full max-h-[400px]"
            />
          )}
          <SingleTextSection
            entityID={props.entityID}
            section="card/content"
            placeholderOnHover={true}
            className={`whitespace-pre-wrap truncate leading-tight text-sm pt-1 ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          />
        </div>

        {/* Big Card Preview Resize and Rotate */}
        {sections !== null && sections.length === 0 ? (
          <div />
        ) : (
          <small className="SectionCounter text-grey-80 hover:text-accent-blue hover:underline">
            <Link href={props.href}>
              <a>+ {sections?.length} sections</a>
            </Link>
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
