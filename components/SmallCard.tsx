import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { Gripper } from "./Gripper";
import { Close } from "./Icons";

export function SmallCard(props: {
  href: string;
  entityID: string;
  id: string;
  draggable?: boolean;
  onDelete?: () => void;
}) {
  let { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
      disabled: !props.draggable,
      id: props.id,
    });
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");

  const style = transform
    ? {
        zIndex: 100,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition,
      }
    : undefined;

  return (
    <div
      className={`min-w-36 max-w-[151px] touch-manipulation relative origin-center`}
      style={style}
      ref={setNodeRef}
    >
      {!!props.onDelete ? (
        <button onClick={props.onDelete}>
          <Close className="text-accent-blue absolute -right-2.5 z-10" />
        </button>
      ) : null}

      <div className="border-[1] border-grey-80 shadow-drop rounded-md p-2 pl-1 w-[151px] h-24 overflow-hidden bg-white flex flex-row gap-2 relative">
        {!!props.draggable ? (
          <Gripper
            {...attributes}
            {...listeners}
            className="touch-manipulation"
          />
        ) : (
          <div></div>
        )}

        <Link href={props.href}>
          <a className="h-full w-full">
            {!title ? (
              <small>
                <pre className="whitespace-pre-wrap">{content?.value}</pre>
              </small>
            ) : (
              <h4 className="normal-case leading-tight">{title.value}</h4>
            )}
          </a>
        </Link>
      </div>
    </div>
  );
}
