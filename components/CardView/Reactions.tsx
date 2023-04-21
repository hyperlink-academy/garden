import { AddSmall, ReactionAdd } from "components/Icons";
import { ref } from "data/Facts";
import { useReactions } from "hooks/useReactions";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";

export const Reactions = (props: { entityID: string }) => {
  let { authorized } = useMutations();
  let [open, setOpen] = useState(false);

  let reactions = useReactions(props.entityID);
  if (reactions.length === 0) return null;
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex">
        <ReactionList entityID={props.entityID} />
        {authorized && (
          <button
            className="text-grey-55 hover:text-accent-blue"
            onClick={() => setOpen(!open)}
          >
            <ReactionAdd />
          </button>
        )}
      </div>
      {open && authorized && (
        <AddReaction entityID={props.entityID} close={() => setOpen(false)} />
      )}
    </div>
  );
};

export const ReactionList = (props: { entityID: string }) => {
  let reactions = useReactions(props.entityID);

  return (
    <div className="reactionAddedReactions flex w-full flex-row flex-wrap items-center gap-2">
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
    </div>
  );
};

export const AddReaction = (props: { entityID: string; close: () => void }) => {
  let { authorized, mutate, memberEntity } = useMutations();
  let reactions = useIndex.aev("space/reaction");
  let [editing, setEditing] = useState(false);
  let [newReaction, setNewReaction] = useState("");
  if (!authorized) return null;
  return (
    <div className="reactionPicker flex w-full flex-wrap gap-x-4 gap-y-2 rounded-md border border-grey-80 bg-white py-1 px-2">
      {reactions
        .filter((f) => !!f.value) // strip empty strings
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
              props.close();
            }}
          >
            {r.value}
          </button>
        ))}
      <div className="flex gap-1">
        {editing && (
          <input
            className="h-6 w-[6ch] self-center"
            autoFocus
            maxLength={4}
            value={newReaction}
            onChange={(e) => setNewReaction(e.currentTarget.value)}
          />
        )}
        <button
          className="text-grey-55 hover:text-accent-blue disabled:hover:text-grey-55"
          onClick={async () => {
            if (!editing) return setEditing(true);
            if (!memberEntity) return;
            await mutate("addReaction", {
              reaction: newReaction.slice(0, 4),
              reactionFactID: ulid(),
              reactionAuthorFactID: ulid(),
              memberEntity,
              cardEntity: props.entityID,
            });
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
            props.close();
          }}
          disabled={editing && newReaction == "" ? true : false}
        >
          <AddSmall />
        </button>
      </div>
    </div>
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
          : "border-grey-80"
      }`}
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
  count: number;
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
      <span className="text-xs text-grey-55">{props.count}</span>
    </div>
  );
};
