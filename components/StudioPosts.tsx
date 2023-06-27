import { ref } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";
import { ButtonPrimary } from "./Buttons";
import { Textarea } from "./Textarea";

export function StudioPosts(props: { id: string }) {
  let { data } = useStudioData(props.id);
  let { session } = useAuth();
  let { mutate, memberEntity } = useMutations();
  let posts = useIndex.aev("feed/post").sort((a, b) => {
    let aPosition = a.value,
      bPosition = b.value;
    if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
    return aPosition > bPosition ? 1 : -1;
  });
  let [selectedSpaces, setSelectedSpace] = useState<string[]>([]);
  let [value, setValue] = useState("");
  return (
    <div>
      {/* TODO - replace this with updated 'authorized' in useMutations() */}
      {data?.members_in_studios.find((m) => m.member === session?.user?.id) && (
        <div>
          {data?.spaces_in_studios.map((s) => {
            if (!s.space) return;
            let spaceID = s.space;
            return (
              <button
                className={`${
                  selectedSpaces.includes(spaceID) ? "underline" : ""
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

          <Textarea
            className="w-full rounded-md border bg-white p-2"
            value={value}
            placeholder=" "
            onChange={(e) => setValue(e.currentTarget.value)}
          />

          <ButtonPrimary
            content="Send"
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
                  value: generateKeyBetween(null, posts[0]?.value || null),
                  positions: {},
                },
              ]);
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <Post entityID={post.entity} key={post.entity} studioID={props.id} />
        ))}
      </div>
    </div>
  );
}

const Post = (props: { entityID: string; studioID: string }) => {
  let { data } = useStudioData(props.studioID);
  let attachedSpaces = useIndex.eav(props.entityID, "post/attached-space");
  let content = useIndex.eav(props.entityID, "card/content");
  let createdBy = useIndex.eav(props.entityID, "card/created-by");
  let creatorName = useIndex.eav(createdBy?.value.value || null, "member/name");
  let type = useIndex.eav(props.entityID, "post/type");
  return (
    <div className="flex flex-col gap-2 rounded-md border p-4">
      {creatorName && <div className="w-fit border">{creatorName?.value}</div>}
      {type?.value}
      {content?.value}
      {attachedSpaces && attachedSpaces?.length > 0 && (
        <div className="flex flex-row gap-1 border p-2">
          <span>attached spaces:</span>
          {attachedSpaces?.map((space) => {
            let spaceData = data?.spaces_in_studios.find(
              (s) => s.space === space.value
            );
            return (
              <Link
                href={`/s/${spaceData?.space_data?.owner.username}/s/${spaceData?.space_data?.name}`}
                key={spaceData?.space}
              >
                {spaceData?.space_data?.display_name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
