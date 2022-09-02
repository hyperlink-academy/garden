import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { SingleTextSection } from "./CardView/Sections";
import { Gripper, GripperBG } from "./Gripper";
import {
  DragRotateHandle,
  ExternalLink,
  GoToPage,
  MakeBigHandle,
  MakeSmallHandle,
  Member,
  RightArrow,
} from "./Icons";
import { Handler, useDrag } from "@use-gesture/react";
import { isUrl } from "src/isUrl";

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
  onRotateDrag?: Handler<"drag">;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  onResize?: () => void;
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
    <div
      style={{}}
      className={`
      grid grid-cols-[auto_max-content] items-end gap-1
      group
      ${props.size === "small" ? "w-[167px] h-24" : "w-[300px] h-fit"}`}
    >
      <div className={`relative h-full ${borderStyles({ isDeck, isMember })}`}>
        {props.size === "small" ? (
          <SmallCardBody {...props} />
        ) : (
          <BigCardBody {...props} />
        )}
      </div>
      <RotateAndResize {...props} />
    </div>
  );
};

const SmallCardBody = (props: { entityID: string } & SharedProps) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");

  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let image = useIndex.eav(props.entityID, "card/image");
  let url = content?.value ? isUrl(content?.value) : false;

  let bind = useDrag(props.onRotateDrag ? props.onRotateDrag : () => {});
  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className="grid grid-cols-[max-content_auto] pr-3 pl-0 py-2 h-full !bg-cover !bg-center !bg-no-repeat"
      style={{
        background: imageUrl ? `url(${imageUrl})` : "",
      }}
    >
      <div className="gripper pl-1 pr-2 overflow-hidden text-grey-80">
        {props.dragHandleProps && (
          <GripperBG
            {...props.dragHandleProps.attributes}
            {...props.dragHandleProps.listeners}
          />
        )}
      </div>
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

            {/* <div className="leading-3 ">
              {props.onResize && (
                <button
                  className="hover:text-accent-blue "
                  onClick={() => props.onResize?.()}
                >
                  <MakeBigHandle />
                </button>
              )}
            </div>
            {props.onRotateDrag && (
              <div {...bind()} className="touch-none hover:text-accent-blue  ">
                <DragRotateHandle />
              </div>
            )} */}
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
  let bind = useDrag(props.onRotateDrag ? props.onRotateDrag : () => {});
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
        {props.dragHandleProps && (
          <div className="h-full">
            <GripperBG
              {...props.dragHandleProps.attributes}
              {...props.dragHandleProps.listeners}
            />
          </div>
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

export const RotateAndResize = (
  props: {
    entityID: string;
  } & SharedProps
) => {
  let sections = useIndex.eav(props.entityID, "card/section");
  let bind = useDrag(props.onRotateDrag ? props.onRotateDrag : () => {});

  return (
    <div className="text-grey-80 grid grid-rows-2 gap-1 pb-1 opacity-0 group-hover:opacity-100">
      <div className="leading-3 ">
        {props.onResize && (
          <button
            className="hover:text-accent-blue"
            onClick={() => props.onResize?.()}
          >
            {props.size === "big" ? <MakeSmallHandle /> : <MakeBigHandle />}
          </button>
        )}
      </div>

      {props.onRotateDrag && (
        <div {...bind()} className="touch-none hover:text-accent-blue  ">
          <DragRotateHandle />
        </div>
      )}
    </div>
  );
};
