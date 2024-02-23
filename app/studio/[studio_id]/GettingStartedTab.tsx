import { useAuth } from "hooks/useAuth";
import { db, useMutations } from "hooks/useReplicache";
import { Props } from "./StudioPage";
import { ref } from "data/Facts";

export const useHasGettingStartedItems = (props: Props) => {
  let { session } = useAuth();
  let { memberEntity } = useMutations();
  let home = db.useAttribute("home")[0];
  let isMember = props.data.members_in_studios.find(
    (m) => m.member === session.user?.id
  );
  let gettingStartedItems = db.useEntity(home?.entity, "checklist/item");
  let completed = db.useEntity(home?.entity, "checklist/completed-by");
  if (!isMember) return false;
  if (!gettingStartedItems || completed?.find((m) => m.entity === memberEntity))
    return false;
  return true;
};
export function GettingStartedTab() {
  let home = db.useAttribute("home")[0];
  let items = db.useEntity(home?.entity, "checklist/item") || [];
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-3 pb-6 sm:pt-6">
      {items.map((item) => {
        return (
          <GettingStartedItem
            key={item.id}
            entityID={item.id}
            value={item.value}
          />
        );
      })}
    </div>
  );
}

function GettingStartedItem(props: { entityID: string; value: string }) {
  let { memberEntity, mutate } = useMutations();
  let checkedBy = db.useEntity(props.entityID, "checklist/item-completed-by");
  let checkedByUser = checkedBy?.find((m) => m.value.value === memberEntity);

  return (
    <div className="lightBorder flex w-full flex-row items-start gap-3 bg-white p-2 ">
      <input
        type="checkbox"
        className="mt-[7px]"
        checked={!!checkedByUser}
        onChange={async (e) => {
          if (!memberEntity) return;
          await mutate("checkCheckListItem", {
            itemEntity: props.entityID,
            memberEntity: memberEntity,
            checked: e.currentTarget.checked,
          });
        }}
      />
      <div
        className={`${
          checkedByUser
            ? "text-grey-55 decoration-grey-80 line-through"
            : "test-grey-35 font-bold"
        } `}
      >
        {props.value}
      </div>
    </div>
  );
}
