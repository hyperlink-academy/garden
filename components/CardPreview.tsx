import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { SingleTextSection } from "./CardView/Sections";
import { Gripper } from "./Gripper";
import { Member, RightArrow } from "./Icons";
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
    <div
      className="w-full overflow-hidden h-full pr-3 pl-0 py-2 flex flex-row"
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      <div className="pl-1 pr-2 overflow-hidden">
        {props.onRotateDrag && (
          <div {...bind()} className="touch-none">
            r
          </div>
        )}
        {props.dragHandleProps && (
          <Gripper
            {...props.dragHandleProps.attributes}
            {...props.dragHandleProps.listeners}
          />
        )}
      </div>
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
      <div className="text-sm">
        {props.onResize && (
          <button onClick={() => props.onResize?.()}>b</button>
        )}
      </div>
    </div>
  );
};

const BigCardBody = (props: { entityID: string } & SharedProps) => {
  let image = useIndex.eav(props.entityID, "card/image");
  let bind = useDrag(props.onRotateDrag ? props.onRotateDrag : () => {});
  return (
    <div
      className="w-full overflow-hidden h-full pr-3 pl-0 py-2 flex flex-row"
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      <div className="pl-1 pr-2 overflow-hidden">
        {props.onRotateDrag && (
          <div {...bind()} className="touch-none">
            r
          </div>
        )}
        {props.dragHandleProps && (
          <Gripper
            {...props.dragHandleProps.attributes}
            {...props.dragHandleProps.listeners}
          />
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        <div className="grid grid-cols-[auto_max-content]">
          <SingleTextSection
            entityID={props.entityID}
            section="card/title"
            className={`font-bold ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            }`}
          />
          <div>
            {props.onResize && (
              <button onClick={() => props.onResize?.()}>smol</button>
            )}
            <Link href={props.href}>
              <a className="text-accent-blue justify-end">
                <RightArrow />
              </a>
            </Link>
          </div>
        </div>
        <div>
          <SingleTextSection
            entityID={props.entityID}
            section="card/content"
            className={`whitespace-pre-wrap truncate leading-tight text-sm ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          />
        </div>
      </div>
    </div>
  );
};
