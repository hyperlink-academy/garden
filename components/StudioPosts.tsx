import * as Popover from "@radix-ui/react-popover";
import { ref } from "data/Facts";
import { useReactions } from "hooks/useReactions";
import { useRemoteCardData } from "hooks/useRemoteCardData";
import { db, useMutations } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import { useStudioData } from "hooks/useStudioData";
import useWindowDimensions from "hooks/useWindowDimensions";
import { spacePath } from "hooks/utils";
import Link from "next/link";
import { useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { decodeTime, ulid } from "src/ulid";
import { AddReaction, SingleReactionPreview } from "./CardView/Reactions";
import { CreateStudioPost } from "./CreateStudioPost";
import { DoorImage } from "./Doors";
import { ReactionAdd } from "./Icons";
import { SpaceCard, SpaceData } from "./SpacesList";
import { CardBigView } from "./StudioPostFullScreen";
import { RenderedText } from "./Textarea/RenderedText";

export function StudioPosts(props: { id: string }) {
  let { width } = useWindowDimensions();
  let { mutate, memberEntity } = useMutations();
  let posts = db.useAttribute("feed/post").sort((a, b) => {
    let aPosition = a.value,
      bPosition = b.value;
    if (aPosition === bPosition) return a.id > b.id ? -1 : 1;
    return aPosition > bPosition ? -1 : 1;
  });
  return (
    <div className="flex flex-col-reverse gap-4">
      <div
        className={`PostListWrapper flex flex-col-reverse ${
          width < 768 ? "gap-8" : ""
        }`}
      >
        {posts.map((post, index) => (
          <Post
            renderPosition={width > 768}
            entityID={post.entity}
            key={post.entity}
            studioID={props.id}
            index={index}
          />
        ))}
      </div>

      <CreateStudioPost
        selectSpace
        id={props.id}
        onPost={async ({
          value,
          contentPosition,
          spacePosition,
          selectedSpace,
        }) => {
          let entity = ulid();
          if (!memberEntity || !value) return;
          if (selectedSpace) {
            await mutate("assertFact", [
              {
                entity,
                attribute: "post/attached-space",
                value: selectedSpace,
                positions: {},
              },
              {
                entity,
                attribute: "post/space/position",
                positions: {},
                value: {
                  type: "position",
                  x: spacePosition?.x || 0,
                  y: spacePosition?.y || 0,
                  rotation: 0,
                  size: "small",
                },
              },
            ]);
          }

          await mutate("assertFact", [
            {
              entity,
              attribute: "post/content/position",
              positions: {},
              value: {
                type: "position",
                x: contentPosition?.x || 0,
                y: contentPosition?.y || 0,
                rotation: 0,
                size: "small",
              },
            },
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
              value: generateKeyBetween(
                null,
                posts[posts.length - 1]?.value || null
              ),
              positions: {},
            },
          ]);
        }}
      />
    </div>
  );
}

export function Post(props: {
  renderPosition: boolean;
  entityID: string;
  studioID: string;
  index: number;
}) {
  let { data } = useStudioData(props.studioID);
  let attachedSpace = db.useEntity(props.entityID, "post/attached-space");
  let content = db.useEntity(props.entityID, "card/content");
  let createdBy = db.useEntity(props.entityID, "card/created-by");
  let creatorName = db.useEntity(createdBy?.value.value || null, "member/name");
  let postPosition = db.useEntity(props.entityID, "post/content/position");
  let spacePosition = db.useEntity(props.entityID, "post/space/position");
  let cardPosition = db.useEntity(
    props.entityID,
    "post/attached-card/position"
  );

  let date = new Date(decodeTime(props.entityID)).toLocaleDateString([], {
    dateStyle: "short",
  });
  let type = db.useEntity(props.entityID, "post/type");
  let attachedCard = db.useEntity(props.entityID, "post/attached-card");
  const lowestYValue = Math.min(
    ...([
      postPosition?.value.y,
      spacePosition?.value.y,
      cardPosition?.value.y,
    ].filter((v) => v !== undefined) as number[])
  );

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
  let cardSpaceData = data?.spaces_in_studios.find(
    (s) => s.space === attachedCard?.value.space_do_id
  );

  return (
    <div
      className={`relative ${props.renderPosition ? "pb-64" : ""}`}
      style={{
        marginTop: props.renderPosition ? -lowestYValue : "",
      }}
    >
      {space && (
        <span
          className={`studioPostAttachedCard flex ${
            props.renderPosition ? "absolute" : ""
          } flex-row gap-2`}
          style={
            props.renderPosition
              ? {
                  top: spacePosition?.value.y || 0,
                  left: spacePosition?.value.x || 0,
                }
              : {}
          }
        >
          {
            <Link
              href={`/s/${space?.space_data?.owner.username}/s/${space?.space_data?.name}`}
              key={space?.space}
              className="font-bold text-accent-blue"
            >
              <SpaceCard small {...(space?.space_data as SpaceData)} />
            </Link>
          }
        </span>
      )}
      {attachedCard && cardSpaceData && (
        <div
          className={props.renderPosition ? "absolute" : ""}
          style={
            props.renderPosition
              ? {
                  top: cardPosition?.value.y || 0,
                  left: cardPosition?.value.x || 0,
                }
              : {}
          }
        >
          <RemoteCardData
            space_data={cardSpaceData.space_data}
            {...attachedCard.value}
          />
        </div>
      )}
      <div
        className="studioPost group relative -mt-5 flex w-96 max-w-lg flex-col gap-1"
        style={
          props.renderPosition
            ? {
                left: postPosition?.value.x || 0,
                top: postPosition?.value.y || 0,
              }
            : {}
        }
      >
        <div className="studioPostTimeStamp text-right text-xs italic text-grey-55 opacity-0 group-hover:opacity-100">
          {date}
        </div>
        <div className="StudioPostContent flex flex-col gap-1 rounded-md border border-grey-80 bg-white px-4 pt-3 pb-4">
          <RenderedText
            text={content?.value || ""}
            style={{ whiteSpace: "pre-wrap" }}
          />
          <hr className="border-grey-80" />
          <div className="flex items-center justify-between gap-4">
            {creatorName && (
              <div className="flex w-full grow items-center gap-2 overflow-x-hidden text-right text-sm font-bold text-grey-55">
                {creatorName?.value}
              </div>
            )}
            <PostReactions entityID={props.entityID} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const RemoteCardData = (props: {
  space_data: {
    display_name: string;
    name: string;
    owner: { username: string };
    default_space_image: string;
    image: string;
  };
  space_do_id: string;
  cardEntity: string;
  linkDisabled?: boolean;
}) => {
  let { data } = useRemoteCardData(props.space_do_id, props.cardEntity);
  if (!data) return null;

  return (
    <RemoteCard
      space_do_id={props.space_do_id}
      cardEntity={props.cardEntity}
      space_data={props.space_data}
      linkDisabled={props.linkDisabled}
      {...data}
    />
  );
};

export const RemoteCard = (props: {
  title: string | undefined;
  content: string | undefined;
  creator: string | undefined;
  space_data: {
    display_name: string;
    name: string;
    owner: { username: string };
    default_space_image: string;
    image: string;
  };
  space_do_id: string;
  cardEntity: string;
  linkDisabled?: boolean;
}) => {
  let [open, setOpen] = useState(false);

  return (
    <div className="flex max-h-60 max-w-[420px] flex-col gap-2 rounded-md border border-grey-90 bg-[#FDFCFA] p-3 text-grey-35 shadow-inner">
      {/* card title and content preview */}
      {/* click for popup view of full card content */}
      <button
        disabled={props.linkDisabled}
        className="overflow-hidden text-left"
        onClick={() => setOpen(true)}
      >
        <h4 className="shrink-0">{props?.title}</h4>
        <div className="mb-2 shrink grow overflow-hidden">
          <RenderedText
            text={props?.content || ""}
            style={{ whiteSpace: "pre-wrap" }}
          />
        </div>
      </button>
      {open && (
        <CardBigView
          space_do_id={props.space_do_id}
          cardEntity={props.cardEntity}
          onClose={() => setOpen(false)}
        />
      )}
      {/* link to external Space where the card lives */}
      <Link
        className="flex items-center gap-2"
        href={`${spacePath(
          props?.space_data.owner?.username,
          props?.space_data?.name || ""
        )}`}
      >
        <div className="flex shrink-0 items-center gap-2 text-xs italic text-grey-55">
          <span>by {props.creator} in </span>
          <div className="-mt-1">
            <DoorImage
              small
              width="20"
              image={props?.space_data?.image}
              default_space_image={props.space_data?.default_space_image}
            />
          </div>
          <span className="font-bold text-accent-blue">
            {props.space_data?.display_name}
          </span>
        </div>
      </Link>
    </div>
  );
};

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
    <Link
      className={`flex max-w-[420px] flex-col py-4 ${
        !spaceData?.name && "pointer-events-none"
      }`}
      href={`/s/${spaceData?.owner.username}/s/${spaceData?.name}`}
    >
      <h3 className="-mb-9 ml-28 text-grey-55">New Space!</h3>
      <SpaceCard {...(spaceData as SpaceData)} />
    </Link>
  );
}

const PostReactions = (props: { entityID: string }) => {
  let { authorized } = useMutations();
  let [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  let reactions = useReactions(props.entityID);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="cardPreviewReactions flex flex-row items-center gap-1">
        {reactions.slice(0, 3).map(([reaction, data]) => {
          return (
            <SingleReactionPreview
              key={reaction}
              memberReaction={data.memberReaction}
              reaction={reaction}
              entityID={props.entityID}
            />
          );
        })}
        {reactions.length > 3 ? (
          <span className="text-xs italic text-grey-55">
            {`+${reactions.length - 3}`}
          </span>
        ) : (
          ""
        )}
      </div>{" "}
      {authorized ? (
        <Popover.Root
          onOpenChange={() => setReactionPickerOpen(!reactionPickerOpen)}
        >
          <Popover.Trigger className="flex items-center px-1">
            <button
              className={`${
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
  );
};
