import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import { Delete } from "./Icons";

export function SmallCard(props: {
  href: string;
  entityID: string;
  onDrag?: () => void;
  onDelete?: () => void;
}) {
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");

  return (
    <Link href={props.href}>
      <a className="relative min-w-36 max-w-[151px]">
        {!!props.onDelete ? (
          <Delete className="text-accent-blue absolute -right-2.5 z-10" />
        ) : null}
        <div className="border-[1] border-grey-80 shadow-drop rounded-md p-2 min-w-36 max-w-[151px] h-24 overflow-hidden grid gap-2 bg-white">
          {!title ? (
            <small>
              <pre className="whitespace-pre-wrap">{content?.value}</pre>
            </small>
          ) : (
            <h4 className={"uppercase text-grey-35"}>{title.value}</h4>
          )}
        </div>
      </a>
    </Link>
  );
}
