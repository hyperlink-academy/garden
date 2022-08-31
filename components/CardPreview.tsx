import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { SingleTextSection } from "./CardView/Sections";
import { Gripper, GripperBG } from "./Gripper";
import {
  DragRotateHandle,
  GoToPage,
  MakeBigHandle,
  MakeSmallHandle,
  Member,
  RightArrow,
} from "./Icons";
import { Handler, useDrag } from "@use-gesture/react";

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
    size: "big" | "small";
  } & SharedProps
) => {
  let isDeck = !!useIndex.eav(props.entityID, "deck");
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let image = useIndex.eav(props.entityID, "card/image");
  return (
    <div
      style={{}}
      className={`${
        props.size === "small" ? "w-[151px] h-24" : "w-[300px] h-fit"
      }`}
    >
      <div className={`relative h-full ${borderStyles({ isDeck, isMember })}`}>
        {props.size === "small" ? (
          <SmallCardBody {...props} />
        ) : (
          <BigCardBody {...props} />
        )}
      </div>
    </div>
  );
};

const SmallCardBody = (props: { entityID: string } & SharedProps) => {
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let image = useIndex.eav(props.entityID, "card/image");

  let bind = useDrag(props.onRotateDrag ? props.onRotateDrag : () => {});

  return (
    <div className="grid grid-cols-[max-content_auto] pr-3 pl-0 py-2 h-full">
      <div className="gripper pl-1 pr-2 overflow-hidden text-grey-80">
        {props.dragHandleProps && (
          <GripperBG
            {...props.dragHandleProps.attributes}
            {...props.dragHandleProps.listeners}
          />
        )}
      </div>
      <div
        className="cardPreivewContentWrapper w-full overflow-hidden grid grid-rows-[max-content_auto_max-content] gap-2"
        style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
      >
        {/* CardPreivewTitleOrContnet */}
        <Link href={props.href}>
          <a>
            {!title ? (
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
              <h4
                className={`normal-case leading-tight text-ellipsis  ${
                  !image ? "" : "rounded-[3px] px-1 bg-white/75"
                }`}
              >
                {title?.value}
              </h4>
            )}
          </a>
        </Link>

        {/* CardPreviewRotateAndResize */}
        <div className="grid grid-cols-[auto_max-content] items-center text-right w-full gap-2 -mb-1 place-self-end text-grey-80 ">
          <div className="leading-3 ">
            {props.onResize && (
              <button
                className="hover:text-accent-blue"
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
          )}
        </div>
      </div>
    </div>
  );
};

const BigCardBody = (props: { entityID: string } & SharedProps) => {
  let image = useIndex.eav(props.entityID, "card/image");
  let bind = useDrag(props.onRotateDrag ? props.onRotateDrag : () => {});
  let sections = useIndex.eav(props.entityID, "card/section");
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

      {/* Card Preview Content Wrapper */}
      <div className="grid grid-rows-[max-content_auto_max-content] w-full">
        {/* Card Preview Title */}
        <div className="grid grid-cols-[auto_max-content] items-center">
          <SingleTextSection
            entityID={props.entityID}
            section="card/title"
            className={`font-bold ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            }`}
          />
          <Link href={props.href}>
            <a className="text-accent-blue justify-end ">
              <GoToPage />
            </a>
          </Link>
        </div>

        {/* Card Preview Default Content */}
        <div>
          <SingleTextSection
            entityID={props.entityID}
            section="card/content"
            className={`whitespace-pre-wrap truncate leading-tight text-sm pt-1 ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          />
        </div>

        {/* Card Preview Resize and Rotate */}
        <div className="grid grid-cols-[auto_max-content_max-content] items-center  w-full gap-2  pt-4 place-self-end text-grey-80 ">
          {sections !== null && sections.length === 0 ? (
            <small className=" hover:underline">+ no sections</small>
          ) : (
            <small className="text-grey-55 hover:underline">
              <Link href={props.href}>
                <a>+ {sections?.length} sections</a>
              </Link>
            </small>
          )}
          <div className="leading-3 ">
            {props.onResize && (
              <button
                className="hover:text-accent-blue"
                onClick={() => props.onResize?.()}
              >
                <MakeSmallHandle />
              </button>
            )}
          </div>
          {props.onRotateDrag && (
            <div {...bind()} className="touch-none hover:text-accent-blue  ">
              <DragRotateHandle />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
