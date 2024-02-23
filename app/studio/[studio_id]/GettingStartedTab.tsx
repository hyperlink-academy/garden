import { useAuth } from "hooks/useAuth";
import { db, scanIndex, useMutations } from "hooks/useReplicache";
import { Props } from "./StudioPage";
import { ref } from "data/Facts";
import { useSubscribe } from "hooks/useSubscribe";
import { ButtonPrimary } from "components/Buttons";
import { useToaster } from "components/Smoke";

export const useHasGetStartedItems = (props: Props) => {
  let { session } = useAuth();
  let { memberEntity } = useMutations();
  let home = db.useAttribute("home")[0];
  let isMember = props.data.members_in_studios.find(
    (m) => m.member === session.user?.id
  );

  let getStartedItems = db.useEntity(home?.entity, "checklist/item");
  let completed = db.useEntity(home?.entity, "checklist/completed-by");
  if (!isMember) return false;
  if (
    getStartedItems.length === 0 ||
    completed?.find((m) => m.value.value === memberEntity)
  )
    return false;
  return true;
};
export function GetStartedTab(props: {
  setSelectedTab: (tab: number) => void;
}) {
  let home = db.useAttribute("home")[0];
  let toaster = useToaster();
  let { memberEntity, mutate } = useMutations();
  let items = db.useEntity(home?.entity, "checklist/item") || [];
  let completed = useSubscribe(
    async (tx) => {
      if (!memberEntity) return 0;
      let allItems = await scanIndex(tx).eav(home?.entity, "checklist/item");
      let completed = 0;
      for (let item of allItems) {
        let completedBy = await scanIndex(tx).eav(
          item.id,
          "checklist/item-completed-by"
        );
        if (completedBy.find((f) => f.value.value === memberEntity))
          completed++;
      }
      return completed;
    },
    0,
    [home, memberEntity],
    `${memberEntity}-completed`
  );

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-2 pb-6 sm:pt-11">
      <h4 className="text-grey-35">
        Welcome! Complete the following to get set up in this Studio!
      </h4>
      <div className="lightBorder flex flex-col gap-2 p-2">
        {items.map((item) => {
          return (
            <GetStartedItem
              key={item.id}
              entityID={item.id}
              value={item.value}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-col place-items-end gap-1 place-self-end text-right">
        <ButtonPrimary
          disabled={completed !== items.length}
          onClick={async () => {
            if (!memberEntity || !home) return;
            await mutate("assertFact", {
              entity: home.entity,
              attribute: "checklist/completed-by",
              value: ref(memberEntity),
              positions: {},
            });
            props.setSelectedTab(1);
            toaster({
              type: "success",
              text: "Congrats! You Got Started!",
              icon: null,
            });
          }}
          content="Complete Get Started!"
        />
        {completed === items.length && (
          <div className="text-grey-55 text-sm">
            Completing the Get Started removes <br /> it from your studio
            sidebar!
          </div>
        )}
      </div>
    </div>
  );
}

function GetStartedItem(props: { entityID: string; value: string }) {
  let { memberEntity, mutate } = useMutations();
  let checkedBy = db.useEntity(props.entityID, "checklist/item-completed-by");
  let checkedByUser = checkedBy?.find((m) => m.value.value === memberEntity);

  return (
    <div
      className={`lightBorder flex w-full flex-row items-start gap-3  p-2 ${
        checkedByUser ? "bg-background" : "bg-white"
      }`}
    >
      <input
        type="checkbox"
        className="mt-[5px]"
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
            : "text-grey-35 font-bold"
        } `}
      >
        {props.value}
      </div>
    </div>
  );
}
