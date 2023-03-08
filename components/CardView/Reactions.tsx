import { AddSmall, ReactionAdd } from "components/Icons";
import { ref } from "data/Facts";
import { useReactions } from "hooks/useReactions";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";

export const Reactions = (props: { entityID: string }) => {
  let { authorized } = useMutations();
  let [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-1">
      {authorized && (
        <button onClick={() => setOpen(!open)}>
          <ReactionAdd />
        </button>
      )}
      {open && authorized && (
        <AddReaction entityID={props.entityID} close={() => setOpen(false)} />
      )}
      <ReactionList entityID={props.entityID} />
    </div>
  );
};

export const ReactionList = (props: { entityID: string }) => {
  let reactions = useReactions(props.entityID);

  return (
    <div className="flex w-full flex-row flex-wrap items-center gap-2">
      {reactions?.map(([reaction, data]) => {
        return (
          <SingleReaction
            {...data}
            reaction={reaction}
            entityID={props.entityID}
          />
        );
      })}
    </div>
  );
};

const AddReaction = (props: { entityID: string; close: () => void }) => {
  let { authorized, mutate, memberEntity } = useMutations();
  let reactions = useIndex.aev("space/reaction");
  let [editting, setEditting] = useState(false);
  let [newReaction, setNewReaction] = useState("");
  if (!authorized) return null;
  return (
    <div className="flex flex-wrap gap-4 rounded-md border border-grey-90 bg-bg-blue py-1 px-2">
      {reactions.map((r) => (
        <button
          className="text-xl"
          onClick={async () => {
            if (!memberEntity) return;
            let factID = ulid();
            mutate("assertFact", [
              {
                entity: props.entityID,
                factID,
                attribute: "card/reaction",
                value: r.value,
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
            props.close();
          }}
        >
          {r.value}
        </button>
      ))}
      <div className="flex gap-1 text-sm">
        {editting && (
          <input
            className="h-3 w-[6ch] self-center"
            autoFocus
            maxLength={4}
            value={newReaction}
            onChange={(e) => setNewReaction(e.currentTarget.value)}
          />
        )}
        <button
          onClick={() => {
            if (!editting) return setEditting(true);
            if (!memberEntity) return;

            let factID = ulid();
            mutate("assertFact", [
              {
                entity: memberEntity,
                value: newReaction.slice(0, 4),
                factID: ulid(),
                attribute: "space/reaction",
                positions: {},
              },
              {
                entity: props.entityID,
                factID,
                attribute: "card/reaction",
                value: newReaction,
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
            setNewReaction("");
            props.close();
          }}
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
  preview?: boolean;
}) => {
  let { authorized, mutate, memberEntity } = useMutations();
  return (
    <button
      className={`rounded-md border px-2 py-0.5 ${
        props.preview ? "text-xs" : "text-lg"
      } ${
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
      {props.reaction} {props.count}
    </button>
  );
};

export const SingleReactionPreview = (props: {
  entityID: string;
  reaction: string;
  count: number;
  memberReaction: string | null;
}) => {
  let { authorized, mutate, memberEntity } = useMutations();
  return (
    <div
      className={`rounded-md border py-0.5 px-2 text-sm ${
        props.memberReaction
          ? "border-grey-80 bg-bg-blue"
          : "border-grey-80 bg-background"
      }`}
    >
      {props.reaction} {props.count}
    </div>
  );
};

// How should I store which reactions have already been made?
// I could just process the list of reactions and extract out the unique ones,
// but that's kind of complicated. I could use replicache's watch functionality
// which could work well, but is a little frustrating.
