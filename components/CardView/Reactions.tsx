import * as Popover from "@radix-ui/react-popover";
import { AddSmall, ReactionAdd } from "components/Icons";
import { Divider } from "components/Layout";
import { Modal } from "components/Modal";
import { useSmoker } from "components/Smoke";
import { ref } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useLongPress } from "hooks/useLongPress";
import { useReactions } from "hooks/useReactions";
import { db, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";

export const Reactions = (props: { entityID: string }) => {
  let { permissions } = useMutations();
  let authorized = permissions.commentAndReact;
  let [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  let reactions = useReactions(props.entityID);
  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" id="card-reactions">
      <div className="flex flex-wrap justify-start gap-2">
        <ReactionList entityID={props.entityID} />
        {authorized ? (
          <Popover.Root
            onOpenChange={() => setReactionPickerOpen(!reactionPickerOpen)}
          >
            <Popover.Trigger className="flex items-center px-1">
              <button
                className={` ${
                  reactionPickerOpen
                    ? "text-accent-blue"
                    : "text-grey-55 hover:text-accent-blue"
                }`}
              >
                <ReactionAdd />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={8}
                collisionPadding={{ right: 20 }}
                className="-mt-[1px] max-w-[298px]"
              >
                <AddReaction entityID={props.entityID} />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        ) : null}
      </div>
    </div>
  );
};

export const ReactionList = (props: { entityID: string }) => {
  let reactions = useReactions(props.entityID);

  return (
    <>
      {reactions?.map(([reaction, data]) => {
        return (
          <SingleReaction
            {...data}
            key={reaction}
            reaction={reaction}
            entityID={props.entityID}
          />
        );
      })}
    </>
  );
};

export const AddReaction = (props: {
  entityID: string;
  onSelect?: () => void;
}) => {
  let {
    mutate,
    permissions,
    authorized: fullMemberPermissions,
  } = useMutations();
  let { session } = useAuth();
  let authorized = permissions.commentAndReact;
  let reactions = db.useAttribute("space/reaction");
  let [reactionEditOpen, setReactionEditOpen] = useState(false);

  if (!authorized) return null;
  return (
    <div className="reactionPicker border-grey-80 flex flex-col gap-1 rounded-md border bg-white px-3 py-2">
      <div className="reactionOptions flex w-full flex-wrap gap-x-4 gap-y-2">
        {reactions
          .filter((f) => !!f.value) // strip empty strings
          .sort((a, b) => {
            return a.id > b.id ? 1 : -1;
          })
          .map((r) => (
            <button
              key={r.id}
              className="font-bold"
              onClick={async () => {
                if (!session.session || !authorized) return;
                await mutate("addReaction", {
                  reaction: r.value,
                  reactionFactID: ulid(),
                  reactionAuthorFactID: ulid(),
                  session: session.session,
                  cardEntity: props.entityID,
                });
                props.onSelect ? props.onSelect() : null;
              }}
            >
              {r.value}
            </button>
          ))}
      </div>

      {fullMemberPermissions && (
        <>
          <Divider />
          <button
            className="reactionPickerSettings place-self-end text-sm italic text-grey-55 hover:text-accent-blue disabled:hover:text-grey-55"
            onClick={() => setReactionEditOpen(true)}
          >
            add / remove
          </button>
        </>
      )}
      <EditReactions
        reactionEditOpen={reactionEditOpen}
        onClose={() => setReactionEditOpen(false)}
        entityID={props.entityID}
      />
    </div>
  );
};

export const EditReactions = (props: {
  entityID: string;
  reactionEditOpen: boolean;
  onClose: () => void;
}) => {
  let reactions = db.useAttribute("space/reaction");
  let { mutate, memberEntity } = useMutations();

  let [newReaction, setNewReaction] = useState("");

  let smoker = useSmoker();

  return (
    <Modal
      header="Reactions"
      open={props.reactionEditOpen}
      onClose={() => props.onClose()}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0">
          <div className="text-grey-35 font-bold">Add New</div>
          <div className="text-grey-35 text-sm">
            You can use up to four characters of emojis, text, or even unicode!
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="w-24"
            autoFocus
            maxLength={4}
            value={newReaction}
            onChange={(e) => {
              setNewReaction(e.currentTarget.value);
            }}
          />
          <button
            className="text-accent-blue shrink-0"
            onClick={async (e: React.MouseEvent) => {
              if (!memberEntity) return;
              if (reactions.map((r) => r.value).includes(newReaction)) {
                smoker({
                  position: { x: e.clientX, y: e.clientY },
                  text: "that already exists!",
                  error: true,
                });
              } else {
                await mutate("assertFact", [
                  {
                    entity: memberEntity,
                    value: newReaction.slice(0, 4),
                    factID: ulid(),
                    attribute: "space/reaction",
                    positions: {},
                  },
                ]);
                setNewReaction("");
              }
            }}
          >
            <AddSmall />
          </button>
        </div>
        <div className="my-2">
          <Divider />
        </div>
        <div className="text-grey-35 font-bold">Edit Existing</div>

        <div className="mx-auto flex max-h-[440px] flex-wrap place-items-center gap-2 place-self-center overflow-scroll">
          {reactions
            .filter((f) => !!f.value) // strip empty strings
            .sort((a, b) => {
              return a.id > b.id ? 1 : -1;
            })
            .map((r) => (
              <div key={r.value} className="lightBorder w-20 p-1 text-center">
                <h4>{r.value} </h4>
                <button
                  className="text-grey-55 hover:text-accent-blue text-sm italic"
                  onClick={async () => {
                    await mutate("retractFact", { id: r.id });
                  }}
                >
                  remove
                </button>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
};

export const SingleReaction = (props: {
  members: string[];
  entityID: string;
  reaction: string;
  count: number;
  memberReaction: string | null;
}) => {
  let { permissions, mutate, memberEntity } = useMutations();
  let authorized = permissions.commentAndReact;
  let { session } = useAuth();
  let [hover, setHover] = useState(false);
  let { isLongPress, handlers } = useLongPress(() => {
    setHover(true);
  });
  return (
    <Popover.Root open={hover}>
      <Popover.Anchor>
        <button
          onPointerUp={() => setHover(false)}
          {...handlers}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`text-md flex items-center gap-2 rounded-md border px-2 py-0.5 ${
            props.memberReaction
              ? "border-accent-blue bg-bg-blue"
              : "border-grey-80 bg-white"
          } ${!authorized ? "cursor-default" : ""}`}
          onClick={() => {
            if (!session.session || !authorized) return;
            if (isLongPress.current) return;
            if (props.memberReaction && memberEntity)
              return mutate("removeReaction", {
                cardEntity: props.entityID,
                memberEntity,
                reaction: props.reaction,
              });
            let factID = ulid();
            mutate("addReaction", {
              cardEntity: props.entityID,
              reaction: props.reaction,
              reactionFactID: factID,
              reactionAuthorFactID: ulid(),
              session: session.session,
            });
          }}
        >
          <strong>{props.reaction}</strong>{" "}
          <span className="text-grey-55 text-sm">{props.count}</span>
        </button>
      </Popover.Anchor>
      <Popover.Content sideOffset={4}>
        <div className="text-grey-55 lightBorder rounded-md bg-white px-2 py-1 text-xs">
          {props.members.join(", ")}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
};

export const SingleReactionPreview = (props: {
  entityID: string;
  reaction: string;
  count?: number;
  memberReaction: string | null;
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-1 py-0.5 text-xs ${
        props.memberReaction
          ? "border-grey-90 bg-bg-blue"
          : "border-grey-90 bg-background"
      }`}
    >
      <strong>{props.reaction}</strong>
      {props.count && (
        <span className="text-grey-55 text-xs">{props.count}</span>
      )}
    </div>
  );
};
