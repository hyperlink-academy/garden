import { ref } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";
import { ButtonPrimary } from "./Buttons";
import { Send } from "./Icons";
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
    <div className="flex flex-col gap-4">
      {/* TODO - replace this with updated 'authorized' in useMutations() */}
      {data?.members_in_studios.find((m) => m.member === session?.user?.id) && (
        <div className="PostCreateWrapper flex flex-col gap-2 rounded-md border bg-white p-2">
          {/* <p className="text-center font-bold italic">new post</p> */}
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
                  value: generateKeyBetween(null, posts[0]?.value || null),
                  positions: {},
                },
              ]);
              setValue("");
              setSelectedSpace([]);
            }}
          />
        </div>
      )}
      <div className="PostListWrapper flex flex-col gap-4">
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
    <div className="flex flex-col gap-2 rounded-md border bg-white p-4">
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
