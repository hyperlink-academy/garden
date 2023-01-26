import { useAuth } from "hooks/useAuth";
import { SearchOrCommand } from "../Icons";
import { useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ButtonSecondary } from "../Buttons";
import { LogInModal } from "../LoginModal";
import { useAllItems, FindOrCreate } from "components/FindOrCreateEntity";
import { ulid } from "src/ulid";
import { publishAppEvent } from "hooks/useEvents";

export const SpaceHeader: React.FC<React.PropsWithChildren<unknown>> = () => {
  let { session } = useAuth();
  return (
    <div className="pageHeader absolute -right-9 bottom-10 z-50 hidden text-grey-35 sm:block">
      <div
        className={`
          headerWrapper
          mx-auto
          flex max-w-6xl place-items-center gap-2 px-2
          pt-4 sm:px-4 sm:pt-8`}
      >
        {!session.session ? (
          <div className="z-10 flex shrink-0 gap-4">
            <Login />
          </div>
        ) : (
          <FindOrCreateBar />
        )}
      </div>
    </div>
  );
};

const Login = () => {
  let [logInOpen, setLogInOpen] = useState(false);
  return (
    <>
      <ButtonSecondary
        content="Log In"
        onClick={() => setLogInOpen(!logInOpen)}
      />

      <LogInModal isOpen={logInOpen} onClose={() => setLogInOpen(false)} />
    </>
  );
};

const FindOrCreateBar = () => {
  let [open, setOpen] = useState(false);
  let items = useAllItems(open);

  let { mutate, memberEntity, action } = useMutations();
  return (
    <>
      <div className="rounded-full bg-background p-2">
        <button
          className="rounded-full border border-accent-blue bg-accent-blue p-4  text-white hover:border hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
          onClick={() => setOpen(!open)}
        >
          <SearchOrCommand />
        </button>
      </div>
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (cards) => {
          if (!memberEntity) return;

          action.start();

          for (let d of cards) {
            let entity;
            if (d.type === "create") {
              entity = ulid();

              if (d.name) {
                await mutate("createCard", {
                  entityID: entity,
                  title: d.name,
                  memberEntity,
                });
              }
            } else {
              entity = d.entity;
            }
            publishAppEvent("cardviewer.open-card", { entityID: entity });
          }

          action.end();
        }}
        // END OF ONSELECT LOGIC
        selected={[]}
        open={open}
        items={items}
      />
    </>
  );
};
