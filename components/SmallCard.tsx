import { DraggableAttributes, useDraggable } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
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
  } & Props
) {
  let { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      disabled: !props.draggable,
      id: props.id,
      data: {
        entityID: props.entityID,
        index: props.index,
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
          className={`border-[1] border-grey-80 shadow-drop rounded-md p-2 pl-1 w-[151px] h-24 overflow-hidden bg-white flex flex-row gap-2 relative`}
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

const styles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    case args.member:
      return "bg-accent-red rounded-md pl-1 p-2";
    case args.deck:
      return "deckBorder";
    default:
      return "border border-grey-80 rounded-md bg-white pl-1 p-2";
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
        ${styles({ deck: !!isDeck, member: !!memberName })}
        }
        `}
      >
        <div
          className={`flex flex-row gap-0 h-full ${
            !!isDeck ? "-mt-1 -mr-1" : ""
          }`}
        >
          {!!props.draggable ? (
            <Gripper
              {...props.attributes}
              {...props.listeners}
              className={`touch-manipulation pr-2 pl-1 ${
                !!memberName ? "text-white" : "text-grey-35"
              }`}
            />
          ) : (
            <div className="px-2" />
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
          <div className="h-full pr-2 grid gap-2 grid-rows-[min-content,auto] pb-1">
            <div className="flex flex-row">
              <Member />
              member
            </div>
            <div className="w-full bg-white rounded-md text-accent-red font-bold grid p-1">
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
