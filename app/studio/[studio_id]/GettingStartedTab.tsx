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
    <div>
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
    <div className="flex flex-row gap-2">
      <input
        type="checkbox"
        checked={!!checkedByUser}
        onChange={async (e) => {
          if (!memberEntity) return;
          await mutate("checkCheckListItem", {
            itemEntity: props.entityID,
            memberEntity: memberEntity,
            checked: e.currentTarget.checked,
          });
        }}
      />{" "}
      {props.value}
    </div>
  );
}
