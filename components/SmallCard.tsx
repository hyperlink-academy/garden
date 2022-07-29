import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import { isUrl } from "src/isUrl";
import { Gripper } from "./Gripper";
import { Close, ExternalLink, Member } from "./Icons";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

type Props = {
  href: string;
  entityID: string;
  draggable?: boolean;
  onDelete?: () => void;
};

export function SortableSmallCard(
  props: {
    id: string;
    index: number;
    parent: string;
    section: string;
    positionKey: string;
  } & Props
) {
  let { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      disabled: !props.draggable,
      id: props.id,
      data: {
        entityID: props.entityID,
        index: props.index,
        positionKey: props.positionKey,
        parent: props.parent,
        section: props.section,
      },
    });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition,
      }
    : undefined;

  return (
    <div style={style} ref={setNodeRef}>
      {isDragging ? (
        <div
          className={`border-grey-80 border rounded-md w-[151px] h-24 bg-grey-90 relative`}
        />
      ) : (
        <SmallCard listeners={listeners} attributes={attributes} {...props} />
      )}
    </div>
  );
}

const borderStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    //border styles found in global.css
    case args.member:
      return "memberCardBorder";
    case args.deck:
      return "deckCardBorder";
    default:
      return "defaultCardBorder";
  }
};

const contentStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    case args.member:
      return "pr-1 pl-0 pb-1 pt-2";
    case args.deck:
      return "pr-3 pl-0 py-2";
    default:
      return "pr-3 pl-0 py-2";
  }
};

export const SmallCard = (
  props: {
    entityID: string;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  } & Props
) => {
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let isDeck = useIndex.eav(props.entityID, "deck");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let image = useIndex.eav(props.entityID, "card/image");

  let title = !!memberName ? memberName : cardTitle;

  return (
    <BaseSmallCard
      entityID={props.entityID}
      title={title?.value || ""}
      content={content?.value || ""}
      isDeck={!!isDeck}
      href={props.href}
      isMember={!!memberName}
      attributes={props.attributes}
      listeners={props.listeners}
      draggable={props.draggable}
      onDelete={props.onDelete}
      image={
        !image
          ? undefined
          : image.value.filetype === "image"
          ? image.value.id
          : image.value.url
      }
    />
  );
};

export const BaseSmallCard = (props: {
  entityID?: string;
  title: string;
  content: string;
  isDeck?: boolean;
  isMember?: boolean;
  draggable?: boolean;
  href: string;
  onDelete?: () => void;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  image?: string;
}) => {
  let url = props.content ? isUrl(props.content) : false;
  let [focused, setFocused] = useState(false);

  return (
    <div
      className={`w-[151px] h-24 touch-manipulation relative origin-center`}
      onPointerOver={(e) => {
        if (e.pointerType === "mouse") setFocused(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setFocused(false);
      }}
    >
      <div
        className={`
        w-full h-24 
        overflow-hidden 
        relative
        !bg-cover
        !bg-center
        !bg-no-repeat
        ${borderStyles({
          deck: !!props.isDeck,
          member: !!props.isMember,
        })}
        `}
        style={{
          background: `${
            props.image ? `url(${WORKER_URL}/static/${props.image})` : ""
          }`,
        }}
      >
        <div
          className={`flex flex-row gap-0 h-full 
          ${contentStyles({ deck: !!props.isDeck, member: !!props.isMember })}
          `}
        >
          {!!props.draggable ? (
            <Gripper
              {...props.attributes}
              {...props.listeners}
              id={props.entityID}
              className={`touch-manipulation pl-1 pr-2 ${
                !!props.isMember ? "text-white" : "text-grey-55"
              }`}
            />
          ) : (
            <div className="pr-[inherit]" />
          )}

          <Link href={props.href}>
            <a className="flex flex-col w-full">
              <CardBody
                member={!!props.isMember}
                content={props.content}
                title={props.title}
                href={props.href}
                image={props.image}
              />
              {url ? (
                <a
                  href={props.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="text-accent-blue float-right -mr-1">
                    <ExternalLink />
                  </div>
                </a>
              ) : null}
            </a>
          </Link>
        </div>
      </div>
      {!!props.onDelete && focused ? (
        <button onClick={() => props.onDelete?.()}>
          <Close className="text-accent-blue absolute -right-2.5 -top-2 z-10" />
        </button>
      ) : null}
    </div>
  );
};

export const CardBody = (props: {
  member?: boolean;
  content?: string;
  title?: string;
  href: string;
  image?: string;
}) => {
  if (props.member)
    return (
      <span className="w-full h-full">
        <div className="h-full grid gap-1 grid-rows-[min-content,auto]">
          <div className="grid grid-cols-[auto_max-content] items-end text-white">
            <Member />
            <small>member</small>
          </div>

          <div className="w-full bg-white rounded-md text-accent-red font-bold grid py-1 px-2 leading-tight text-ellipsis overflow-hidden">
            <span className="self-end">{props.title}</span>
          </div>
        </div>
      </span>
    );
  return (
    <span className="w-full overflow-hidden h-full">
      {!props.title ? (
        <small>
          <pre
            className={`whitespace-pre-wrap truncate leading-tight ${
              !props.image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          >
            {props.content}
          </pre>
        </small>
      ) : (
        <h4
          className={`normal-case leading-tight  text-ellipsis  ${
            !props.image ? "" : "rounded-[3px] px-1 bg-white/75"
          }`}
        >
          {props.title}
        </h4>
      )}
    </span>
  );
};
