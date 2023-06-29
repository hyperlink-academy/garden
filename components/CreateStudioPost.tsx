import { ref } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import { useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";
import { ButtonPrimary } from "./Buttons";
import { Send } from "./Icons";
import { Textarea } from "./Textarea";

export function CreateStudioPost(props: { id: string; latestPost?: string }) {
  let { data } = useStudioData(props.id);
  let { session } = useAuth();
  let [selectedSpaces, setSelectedSpace] = useState<string[]>([]);
  let [value, setValue] = useState("");
  let { mutate, memberEntity } = useMutations();

  if (!data?.members_in_studios.find((m) => m.member === session?.user?.id))
    return null;

  return (
    <div className="PostCreateWrapper flex flex-col gap-2 rounded-md border bg-white p-2">
      <div className="flex flex-col gap-2">
        {data?.spaces_in_studios && data?.spaces_in_studios.length > 0 && (
          <span className="text-sm italic">select space(s) to attach</span>
        )}
        <div className="flex flex-wrap gap-2">
          {data?.spaces_in_studios.map((s) => {
            if (!s.space) return;
            let spaceID = s.space;
            return (
              <button
                className={`rounded-md border py-1 px-2 ${
                  selectedSpaces.includes(spaceID)
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "border-grey-80 hover:border-accent-blue hover:bg-bg-blue"
                }`}
                key={spaceID}
                onClick={() =>
                  selectedSpaces.includes(spaceID)
                    ? setSelectedSpace(
                        selectedSpaces.filter((space) => space !== s.space)
                      )
                    : setSelectedSpace([...selectedSpaces, spaceID])
                }
              >
                {s.space_data?.display_name}
              </button>
            );
          })}
        </div>
      </div>

      <Textarea
        className="w-full rounded-md border bg-white p-2"
        value={value}
        placeholder="share something with the group…"
        onChange={(e) => setValue(e.currentTarget.value)}
      />

      <ButtonPrimary
        content="Send"
        icon={<Send />}
        onClick={async () => {
          let entity = ulid();
          if (!memberEntity) return;
          await mutate("assertFact", [
            ...selectedSpaces.map((space) => {
              return {
                entity,
                attribute: "post/attached-space",
                value: space,
                positions: {},
              } as const;
            }),
            {
              entity,
              attribute: "card/content",
              value,
              positions: {},
            },
            {
              entity,
              attribute: "card/created-by",
              value: ref(memberEntity),
              positions: {},
            },
            {
              entity,
              attribute: "feed/post",
              value: generateKeyBetween(null, props.latestPost || null),
              positions: {},
            },
          ]);
          setValue("");
          setSelectedSpace([]);
        }}
      />
    </div>
  );
}
