import { DraggableAttributes, useDraggable } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { Gripper } from "./Gripper";
import { Close } from "./Icons";

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

export const BaseSmallCard = (
  props: {
    entityID: string;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  } & Props
) => {
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let isDeck = useIndex.eav(props.entityID, "deck");
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
        ${
          !!isDeck
            ? "deckBorder"
            : "border border-grey-80 rounded-md bg-white pl-1 p-2"
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
              className="touch-manipulation pr-2"
            />
          ) : (
            <div></div>
          )}

          <Link href={props.href}>
            <a className={`w-full`}>
              {!title ? (
                <small>
                  <pre className="whitespace-pre-wrap truncate">
                    {content?.value}
                  </pre>
                </small>
              ) : (
                <h4 className="normal-case leading-tight h-full overflow-hidden text-ellipsis">
                  {title.value}
                </h4>
              )}
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};
