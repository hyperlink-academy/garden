import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { Gripper } from "./Gripper";
import { Close, Member } from "./Icons";

type Props = {
  href: string;
  entityID: string;
  draggable?: boolean;
  onDelete?: () => void;
};

export function SmallCard(
  props: {
    id: string;
    index: number;
    parent: string;
    section: string;
    siblings: Fact<keyof ReferenceAttributes>[];
    positionKey: string;
  } & Props
) {
  let { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      disabled: !props.draggable,
      id: props.id,
      data: {
        siblings: props.siblings,
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
          className={`border-grey-80 border rounded-md w-[151px] h-24 bg-grey-90 relative top-6`}
        />
      ) : (
        <BaseSmallCard
          listeners={listeners}
          attributes={attributes}
          {...props}
        />
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
      return "border border-grey-80 rounded-md bg-white ";
  }
};

const contentStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    case args.member:
      return "pb-3 pr-2 pl-1 pt-2 ";
    case args.deck:
      return "pb-4 pr-3 pl-2 pt-2";
    default:
      return "-ml-3 px-3 py-2";
  }
};

export const BaseSmallCard = (
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

  let title = !!memberName ? memberName : cardTitle;
  return (
    <div
      className={`min-w-36 max-w-[151px] touch-manipulation relative origin-center`}
    >
      {!!props.onDelete ? (
        <button onClick={props.onDelete}>
          <Close className="text-accent-blue absolute -right-2.5 z-10" />
        </button>
      ) : null}

      <div
        className={`
        drop-shadow-md
         w-[151px] h-24 
        overflow-hidden 
        relative
        ${borderStyles({ deck: !!isDeck, member: !!memberName })}
        `}
      >
        <div
          className={`flex flex-row gap-0 h-full 
          ${contentStyles({ deck: !!isDeck, member: !!memberName })}
          `}
        >
          {!!props.draggable ? (
            <Gripper
              {...props.attributes}
              {...props.listeners}
              className={`touch-manipulation pl-1 pr-2 ${
                !!memberName ? "text-white" : "text-grey-55"
              }`}
            />
          ) : (
            <div className="pr-[inherit]" />
          )}
          <CardBody
            member={!!memberName}
            content={content?.value}
            title={title?.value}
            href={props.href}
          />
        </div>
      </div>
    </div>
  );
};

const CardBody = (props: {
  member?: boolean;
  content?: string;
  title?: string;
  href: string;
}) => {
  if (props.member)
    return (
      <Link href={props.href}>
        <a className="w-full h-full">
          <div className="h-full grid gap-1 grid-rows-[min-content,auto]">
            <div className="grid grid-cols-[auto_max-content] items-end text-white">
              <Member />
              <small>member</small>
            </div>

            <div className="w-full bg-white rounded-md text-accent-red font-bold grid py-1 px-2 leading-tight text-ellipsis overflow-hidden">
              <span className="self-end">{props.title}</span>
            </div>
          </div>
        </a>
      </Link>
    );
  return (
    <Link href={props.href}>
      <a className={`w-full`}>
        {!props.title ? (
          <small>
            <pre className="whitespace-pre-wrap truncate">{props.content}</pre>
          </small>
        ) : (
          <h4 className="normal-case leading-tight h-full overflow-hidden text-ellipsis">
            {props.title}
          </h4>
        )}
      </a>
    </Link>
  );
};
