import { ButtonSecondary } from "components/Buttons";
import { CardPreview } from "components/CardPreview";
import { CardViewerLayout, useCardViewer } from "components/CardViewerContext";
import { RemoveCard } from "components/Icons";
import { flag } from "data/Facts";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { useContext, useEffect } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";

export default function HighlightPage() {
  let { memberEntity, mutate } = useMutations();
  let inbox = useIndex.eav(memberEntity, "member/inbox");
  let latest = useIndex.eav(memberEntity, "member/last-read-highlight");
  useEffect(() => {
    if (!memberEntity) return;
    let latestInInbox = inbox?.sort((a, b) =>
      a.lastUpdated < b.lastUpdated ? 1 : -1
    )[0];
    if (
      latestInInbox &&
      (!latest || latestInInbox.lastUpdated > latest?.value)
    ) {
      mutate("assertFact", {
        entity: memberEntity,
        value: latestInInbox.lastUpdated,
        attribute: "member/last-read-highlight",
        positions: {},
      });
    }
  }, [memberEntity, inbox, latest]);
  return !memberEntity ? (
    <EmptyState />
  ) : (
    <CardViewerLayout EmptyState={null}>
      <div
        className={`cardViewerWrapper 
          h-full w-[calc(100vw-16px)] max-w-xl 
           pb-4  md:pb-8 
          focus:outline-none
          snap-center touch-pan-x 
          flex flex-col gap-3`}
      >
        {inbox?.map((f) => {
          return (
            <div className="flex flex-col gap-2">
              <CardPreview entityID={f.value.value} size={"big"} />
              <div className="flex flex-row justify-between">
                <button
                  onClick={() => {
                    if (!memberEntity) return;
                    mutate("retractFact", { id: f.id });
                  }}
                >
                  <RemoveCard />
                </button>
                <AddReply cardEntity={f.value.value} />
              </div>
            </div>
          );
        })}
      </div>
    </CardViewerLayout>
  );
}

const AddReply = (props: { cardEntity: string }) => {
  let rep = useContext(ReplicacheContext);
  let { memberEntity, mutate } = useMutations();
  let { open } = useCardViewer();
  return (
    <ButtonSecondary
      content={"Add Reply"}
      onClick={async () => {
        if (!memberEntity || !rep?.rep) return;
        let siblings = await rep.rep.query((tx) =>
          scanIndex(tx).eav(props.cardEntity, "deck/contains")
        );

        let lastPosition = siblings.sort(sortByPosition("eav"))[
          siblings.length - 1
        ]?.positions["eav"];
        let position = generateKeyBetween(lastPosition || null, null);

        let newEntity = ulid();
        let isDeck = await rep.rep.query((tx) =>
          scanIndex(tx).eav(props.cardEntity, "deck")
        );
        if (!isDeck) {
          await mutate("assertFact", {
            entity: props.cardEntity,
            attribute: "deck",
            value: flag(),
            positions: {},
          });
        }
        await mutate("createCard", {
          entityID: newEntity,
          title: "",
          memberEntity,
        });
        await mutate("addCardToSection", {
          cardEntity: newEntity,
          parent: props.cardEntity,
          section: "deck/contains",
          positions: {
            eav: position,
          },
        });
        open({ entityID: newEntity });
      }}
    />
  );
};

function timeSince(ms: number) {
  let minutes = Math.floor(ms / 1000 / 60);
  if (minutes === 0) return "Now";
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }
  let hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  let days = Math.floor(hours / 24);
  return `${days} days ago`;
}

const EmptyState = () => {
  return (
    <div
      className={`
                w-full
                max-w-3xl mx-auto
                overflow-y-scroll       
                relative
                no-scrollbar
                snap-y snap-mandatory snap-start
                border border-dashed border-grey-80 rounded-lg
                text-grey-35
                flex flex-col gap-6
                p-4
                `}
    >
      <h3>No new highlights in this Space!</h3>
      <p>
        When you <strong>Highlight</strong> cards, they show for all members for{" "}
        <strong>24 hrs</strong> — then disappear.
      </p>
      <p>
        To <strong>make a Highlight</strong>, click the icon on any card, and
        optionally add a note.
      </p>
      <p>Use Highlights to focus attention on meaningful things:</p>
      <ul className="list-disc list-outside ml-4">
        <li>New cards…or members!</li>
        <li>Things that need feedback</li>
        <li>Important chat convos</li>
        <li>Next "moves" for the group</li>
      </ul>
      <p>
        Once you've seen a Highlight, it'll be marked (just for you) as read.
      </p>

      <p>
        Since Highlights are ephemeral, act fast: treat them as prompts, respond
        via cards or chat, make new Highlights.
      </p>
      <p>
        <strong>Let's play the infinite game</strong>.
      </p>
    </div>
  );
};
