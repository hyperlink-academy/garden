import { useIndex } from "hooks/useReplicache";
import Link from "next/link";

export function SmallCard(props: { href: string; entityID: string }) {
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "textContent");
  return (
    <Link href={props.href}>
      <a>
        <div className="border-[1] border-grey-80 shadow-drop rounded-md p-2 w-36 h-24 overflow-y-auto overflow-x-hidden grid gap-2">
          <h3 className={"text-sm uppercase font-bold"}>{title?.value}</h3>
          <pre className="whitespace-pre-wrap">{content?.value}</pre>
        </div>
      </a>
    </Link>
  );
}
