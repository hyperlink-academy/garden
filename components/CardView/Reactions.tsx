import * as Popover from "@radix-ui/react-popover";
import { AddSmall, CloseLinedTiny, ReactionAdd } from "components/Icons";
import { Divider, Modal } from "components/Layout";
import { useSmoker } from "components/Smoke";
import { ref } from "data/Facts";
import { useReactions } from "hooks/useReactions";
import { db, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";

export const Reactions = (props: { entityID: string }) => {
  let { authorized } = useMutations();
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
  let { authorized, mutate, memberEntity } = useMutations();
  let reactions = db.useAttribute("space/reaction");
  let [reactionEditOpen, setReactionEditOpen] = useState(false);

  if (!authorized) return null;
  return (
    <div className="reactionPicker flex flex-col gap-1 rounded-md border border-grey-80 bg-white px-3 py-2">
      <div className="reactionOptions flex w-full flex-wrap gap-x-4 gap-y-2 ">
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
                if (!memberEntity) return;
                await mutate("addReaction", {
                  reaction: r.value,
                  reactionFactID: ulid(),
                  reactionAuthorFactID: ulid(),
                  memberEntity,
                  cardEntity: props.entityID,
                });
                props.onSelect ? props.onSelect() : null;
              }}
            >
              {r.value}
            </button>
          ))}
      </div>
      <Divider />
      <button
        className="reactionPickerSettings place-self-end text-sm italic text-grey-55 hover:text-accent-blue disabled:hover:text-grey-55"
        onClick={() => setReactionEditOpen(true)}
      >
        add / remove
      </button>
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
    <Modal open={props.reactionEditOpen} onClose={() => props.onClose()}>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between">
            <div className="font-bold text-grey-35">Add New</div>
            <button className="text-grey-55" onClick={props.onClose}>
              <CloseLinedTiny />
            </button>
          </div>
          <div className="text-sm text-grey-35">
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
            className="shrink-0 text-accent-blue"
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
        <div className=" mx-auto flex max-h-[440px] flex-wrap place-items-center gap-2 place-self-center overflow-scroll">
          {reactions
            .filter((f) => !!f.value) // strip empty strings
            .sort((a, b) => {
              return a.id > b.id ? 1 : -1;
            })
            .map((r) => (
              <div key={r.value} className="lightBorder w-20 p-1 text-center">
                <div className="text-lg font-bold">{r.value} </div>
                <button
                  className="text-sm italic text-grey-55 hover:text-accent-blue"
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
  entityID: string;
  reaction: string;
  count: number;
  memberReaction: string | null;
}) => {
  let { authorized, mutate, memberEntity } = useMutations();
  return (
    <button
      className={`text-md flex items-center gap-2 rounded-md border px-2 py-0.5 ${
        props.memberReaction
          ? "border-accent-blue bg-bg-blue"
          : "border-grey-80 bg-white"
      } ${!authorized ? "cursor-default" : ""}`}
      onClick={() => {
        if (!memberEntity || !authorized) return;
        if (props.memberReaction)
          return mutate("retractFact", { id: props.memberReaction });
        let factID = ulid();
        mutate("assertFact", [
          {
            entity: props.entityID,
            factID,
            attribute: "card/reaction",
            value: props.reaction,
            positions: {},
          },
          {
            entity: factID,
            factID: ulid(),
            attribute: "reaction/author",
            value: ref(memberEntity),
            positions: {},
          },
        ]);
      }}
    >
      <strong>{props.reaction}</strong>{" "}
      <span className="text-sm text-grey-55">{props.count}</span>
    </button>
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
      className={`flex items-center gap-1.5 rounded-md border py-0.5 px-1 text-xs ${
        props.memberReaction
          ? "border-grey-90 bg-bg-blue"
          : "border-grey-90 bg-background"
      }`}
    >
      <strong>{props.reaction}</strong>
      {props.count && (
        <span className="text-xs text-grey-55">{props.count}</span>
      )}
    </div>
  );
};
