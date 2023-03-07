import { AddSmall, ReactionAdd } from "components/Icons";
import { ref } from "data/Facts";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { useContext, useState } from "react";
import { useSubscribe } from "replicache-react";
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
  let { memberEntity } = useMutations();
  let rep = useContext(ReplicacheContext);
  let reactions = useSubscribe(
    rep?.rep,
    async (tx) => {
      let reactions = await scanIndex(tx).eav(props.entityID, "card/reaction");
      let data: {
        [reaction: string]: { count: number; memberReaction: string | null };
      } = {};
      for (let reaction of reactions) {
        let r = data[reaction.value] || { count: 0, memberReaction: null };
        if (memberEntity) {
          let author = await scanIndex(tx).eav(reaction.id, "reaction/author");
          if (author?.value.value === memberEntity)
            r.memberReaction = reaction.id;
        }
        r.count++;
        data[reaction.value] = r;
      }
      return Object.entries(data);
    },
    [],
    [props.entityID, memberEntity]
  );
  return (
    <div className="flex w-full flex-row items-center gap-4">
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
    <div className="flex gap-4 rounded-md border border-grey-90 bg-bg-blue py-1 px-2">
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

const SingleReaction = (props: {
  entityID: string;
  reaction: string;
  count: number;
  memberReaction: string | null;
}) => {
  let { authorized, mutate, memberEntity } = useMutations();
  return (
    <button
      className={`rounded-md border px-2 text-lg ${
        props.memberReaction
          ? "border-accent-blue bg-bg-blue "
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

// How should I store which reactions have already been made?
// I could just process the list of reactions and extract out the unique ones,
// but that's kind of complicated. I could use replicache's watch functionality
// which could work well, but is a little frustrating.
