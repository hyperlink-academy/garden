import { Divider } from "components/Layout";
import { HomeTabs } from "./HomeTabs";

export function UserHomeSidebar(props: { username: string }) {
  return (
    <>
      <div className="pb-3 pt-2">
        <Divider />
      </div>
      <div className="px-3 pb-3">
        <input
          placeholder="search home (ctrl/⌘ K)"
          className="false w-full px-2 py-1 text-sm outline-none"
        />
      </div>
      <HomeTabs username={props.username} />
    </>
  );
}
