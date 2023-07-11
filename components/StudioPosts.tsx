import * as Popover from "@radix-ui/react-popover";
import { useRemoteCardData } from "hooks/useRemoteCardData";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useState } from "react";
import { decodeTime } from "src/ulid";
import { AddReaction, ReactionList } from "./CardView/Reactions";
import { CreateStudioPost } from "./CreateStudioPost";
import { DoorImage } from "./Doors";
import { Note, ReactionAdd } from "./Icons";
import { Divider } from "./Layout";
import { StudioPostFullScreen } from "./StudioPostFullScreen";

export function StudioPosts(props: { id: string }) {
  let posts = useIndex.aev("feed/post").sort((a, b) => {
    let aPosition = a.value,
      bPosition = b.value;
    if (aPosition === bPosition) return a.id > b.id ? -1 : 1;
    return aPosition > bPosition ? -1 : 1;
  });
  return (
    <div className="flex flex-col-reverse gap-4">
      <div className="PostListWrapper flex flex-col-reverse gap-4">
        {posts.map((post, index) => (
          <Post
            entityID={post.entity}
            key={post.entity}
            studioID={props.id}
            index={index}
          />
        ))}
      </div>

      <CreateStudioPost
        id={props.id}
        latestPost={posts[posts.length - 1]?.value}
        latestPostEntity={posts[posts.length - 1]?.entity}
      />
    </div>
  );
}

export function Post(props: {
  entityID: string;
  studioID: string;
  index: number;
}) {
  let { data } = useStudioData(props.studioID);
  let attachedSpace = useIndex.eav(props.entityID, "post/attached-space");
  let content = useIndex.eav(props.entityID, "card/content");
  let createdBy = useIndex.eav(props.entityID, "card/created-by");
  let creatorName = useIndex.eav(createdBy?.value.value || null, "member/name");
  let position = useIndex.eav(props.entityID, "post/content/position");
  let spacePosition = useIndex.eav(props.entityID, "post/space/position");

  let date = new Date(decodeTime(props.entityID)).toLocaleDateString([], {
    dateStyle: "short",
  });
  let type = useIndex.eav(props.entityID, "post/type");
  let attachedCard = useIndex.eav(props.entityID, "post/attached-card");
  if (type?.value === "space_added" && attachedSpace)
    return (
      <NewSpacePost
        {...props}
        spaceID={attachedSpace?.value}
        createdAt={type.lastUpdated}
      />
    );
  let space = data?.spaces_in_studios.find(
    (s) => s.space === attachedSpace?.value
  );
  return (
    <div>
      {space && (
        <span
          className="studioPostAttachedCarcflex relative flex-row gap-2"
          style={{
            top: spacePosition?.value.y || 0,
            left: spacePosition?.value.x || 0,
          }}
        >
          {
            <Link
              href={`/s/${space?.space_data?.owner.username}/s/${space?.space_data?.name}`}
              key={space?.space}
              className="font-bold text-accent-blue"
            >
              {space?.space_data?.display_name}
            </Link>
          }
        </span>
      )}
      <div
        className="studioPost group relative flex w-96 max-w-lg flex-col gap-1 "
        style={{
          marginBottom: 0 - (position?.value.y || 0),
          left: position?.value.x || 0,
        }}
      >
        <div className="studioPostTimeStamp text-right text-xs italic text-grey-55  opacity-0 group-hover:opacity-100">
          {date}
        </div>
        <div className="StudioPostContent flex flex-col gap-1 rounded-md border border-grey-80 bg-white px-4 pt-3 pb-4">
          {content?.value}
          <hr className="border-grey-80" />
          {creatorName && (
            <div className="w-full text-right text-sm font-bold text-grey-55">
              {creatorName?.value}
            </div>
          )}
        </div>
        <div className="studioPostReactionsAndComments mx-3 -mt-3 flex flex-row justify-between ">
          <PostReactions entityID={props.entityID} />
          <PostComments entityID={props.entityID} studioID={props.studioID} />
        </div>
      </div>
      {attachedCard && <RemoteCardData {...attachedCard.value} />}
    </div>
  );
}

const RemoteCardData = (props: { space_do_id: string; cardEntity: string }) => {
  let { data } = useRemoteCardData(props.space_do_id, props.cardEntity);
  if (!data) return null;
  return <RemoteCard {...data} />;
};

function PostComments(props: { entityID: string; studioID: string }) {
  let messagesCount = useIndex.eav(props.entityID, "discussion/message-count");
  let [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="flex flex-row gap-1 rounded-md border border-accent-blue bg-accent-blue p-1 text-white hover:bg-bg-blue hover:text-accent-blue"
        onClick={() => setOpen(true)}
      >
        {messagesCount?.value || 0}
        <Note />
      </button>
      {open && (
        <StudioPostFullScreen
          studioID={props.studioID}
          entityID={props.entityID}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

const PostReactions = (props: { entityID: string }) => {
  let { authorized } = useMutations();
  let [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  if (!authorized) return null;
  return (
    <div className="flex flex-wrap justify-start gap-2">
      <ReactionList entityID={props.entityID} />
      <Popover.Root
        onOpenChange={() => setReactionPickerOpen(!reactionPickerOpen)}
      >
        <Popover.Trigger className="flex items-center px-1">
          <button
            className={`rounded-md border border-grey-80 bg-white p-1 ${
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
    </div>
  );
};

export const RemoteCard = (props: {
  title: string | undefined;
  content: string | undefined;
  creator: string | undefined;
}) => (
  <div className="w-36 rounded-md border border-grey-80 bg-white p-3">
    <h4>{props?.title}</h4>
    <p className="text-xs italic text-grey-55">by {props.creator}</p>
  </div>
);

function NewSpacePost(props: {
  entityID: string;
  studioID: string;
  spaceID: string;
  createdAt: string;
}) {
  let { data: spaceData } = useSpaceData(props.spaceID);
  let date = new Date(parseInt(props.createdAt)).toLocaleDateString([], {
    dateStyle: "short",
  });
  return (
    <Link href={`/s/${spaceData?.owner.username}/s/${spaceData?.name}`}>
      <div className="flex flex-row">
        <div>
          <DoorImage
            width="64"
            image={spaceData?.image}
            default_space_image={spaceData?.default_space_image}
          />
        </div>

        <div className="mt-8 flex flex-col">
          <div className="text-right text-sm italic text-grey-55">{date}</div>
          <div className="-ml-6 w-96 self-end rounded-lg border border-grey-80 bg-white p-4 pl-8">
            <h4>New Space!</h4>
            <hr className="border-grey-80" />
            <h3 className="text-accent-blue">{spaceData?.display_name}</h3>
            <p>{spaceData?.description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
