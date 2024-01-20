import { SingleReactionPreview } from "components/CardView/Reactions";
import { useCardViewer } from "components/CardViewerContext";
import {
  ChatEmptyTiny,
  ExternalLink,
  Member,
  RoomChat,
} from "components/Icons";
import { useReactions } from "hooks/useReactions";
import { db, useMutations } from "hooks/useReplicache";
import { Props } from "./index";
import { useUIState } from "hooks/useUIState";
import { SmallLinkCard } from "./LinkPreviewCard";

export const SmallCardBody = (
  props: {
    entityID: string;
    unreadDiscussions: boolean;
    messagesCount: number;
  } & Props
) => {
  return (
    <BaseSmallCard
      {...props}
      reactions={props.data.reactions}
      title={props.data.title?.value}
      content={props.data.content?.value}
      imageUrl={props.data.imageUrl}
      isMember={props.data.isMember}
      memberName={props.data.member?.value}
      date={props.data.date?.value.value}
      unreadDiscussions={props.unreadDiscussions}
      messagesCount={props.messagesCount}
    />
  );
};

export const BaseSmallCard = (
  props: {
    title?: string;
    // image?: string;
    content?: string;
    imageUrl?: string;
    isMember: boolean;
    memberName?: string;
    date?: string;
    entityID?: string;
    reactions?: ReturnType<typeof useReactions>;
    unreadDiscussions?: boolean;
    messagesCount?: number;
  } & Omit<Props, "size" | "href" | "data">
) => {
  let { authorized } = useMutations();
  let { open } = useCardViewer();
  let linkPreview = db.useEntity(props.entityID || null, "card/link-preview");
  let listenersAndAttributes = authorized
    ? {
        ...props?.dragHandleProps?.attributes,
        ...props?.dragHandleProps?.listeners,
      }
    : {};

  return (
    <div
      {...listenersAndAttributes}
      onClick={() => {
        props.entityID && open({ entityID: props.entityID });
      }}
      className={`h-full w-full !bg-cover !bg-center !bg-no-repeat hover:cursor-pointer ${
        props.isMember ? "pb-1 pl-2 pr-1 pt-2" : "px-2 py-2"
      }`}
      style={{
        background: props.imageUrl ? `url(${props.imageUrl})` : "",
      }}
    >
      {/* Small Card Preview Content Wrapper (is it default or member?) */}
      {!props.isMember ? (
        /* Default Content (Member Content Further Down) */
        <div
          className="flex h-full w-full flex-col items-stretch gap-1 "
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preview Title Or Content */}
          <a className="h-full ">
            {/* if we have an image, do NOT show 'Untitled' placeholder */}
            {props.title ? (
              <div className="-m-1 max-h-full w-fit overflow-hidden text-ellipsis rounded-[4px] bg-white bg-opacity-70 p-1 font-bold leading-tight text-grey-35">
                {props.title}
              </div>
            ) : props.content ? (
              <pre className="-m-1 max-h-full w-fit overflow-hidden truncate whitespace-pre-wrap rounded-[4px] bg-white bg-opacity-60 p-1 leading-tight">
                {props?.content}
              </pre>
            ) : !props.imageUrl ? (
              <div className="block w-full font-bold italic !text-grey-80">
                Untitled
              </div>
            ) : null}
          </a>

          {/* Small Card Preview - External Link */}
          {/* NB: turning this off to simplify! */}
          {/* {url ? (
            <a
              className="fixed -bottom-[12px] right-[52px] rounded-md border border-grey-80 bg-white p-1 text-accent-blue"
              href={props.content}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ExternalLink />
            </a>
          ) : null} */}

          {/* Small Card Preview - Date */}
          {/* NB: turning off to simplify! */}
          {/* {date ? (
            <div className="text-grey-35">
              <CalendarMedium />
            </div>
          ) : null} */}

          {/* Small Card Preview - Reactions */}
          {props.reactions && props.reactions.length > 0 ? (
            <div className="fixed -bottom-[10px] left-[8px] flex items-center gap-1">
              {props.reactions.slice(0, 1).map(([reaction, data]) => {
                if (props.entityID)
                  return (
                    <SingleReactionPreview
                      key={reaction}
                      memberReaction={data.memberReaction}
                      reaction={reaction}
                      entityID={props.entityID}
                    />
                  );
              })}
              {props.reactions.length > 1 ? (
                <span className="rounded-md border border-grey-90 bg-white px-1 py-0.5 text-xs text-grey-55">
                  {`+${props.reactions.length - 1}`}
                </span>
              ) : (
                ""
              )}
            </div>
          ) : null}

          {/* Discussions */}
          {/* three states: unread, existing, none */}
          {/* clicking = shortcut to focus input for a new message */}
          <button
            className={`unreadCount fixed -bottom-[10px] right-[24px]  rounded-md border p-[2px] ${
              props.unreadDiscussions
                ? "unreadCardGlow bg-background text-accent-blue hover:bg-accent-blue hover:text-background"
                : props.messagesCount && props.messagesCount > 0
                ? "border-grey-80 bg-background text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
                : "border-grey-80 bg-white text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
            } `}
            onClick={() => {
              if (!props.entityID) return;
              open({ entityID: props.entityID });
              useUIState.getState().openDrawer(props.entityID, "comments");
              setTimeout(() => {
                document.getElementById("messageInput")?.focus();
              }, 50);
            }}
          >
            {props.messagesCount && props.messagesCount > 0 ? (
              <RoomChat />
            ) : (
              <ChatEmptyTiny />
            )}
          </button>
        </div>
      ) : (
        // END OF DEFAULT CARD CONTENT, START OF MEMBER CARD CONTENT
        <div className="flex h-full w-full flex-col items-stretch gap-2 overflow-hidden">
          <div className="grid grid-cols-[auto_max-content] items-end text-white">
            <Member />
            <span className="mr-0.5 text-sm italic">member</span>
          </div>
          <div
            className={`
            flex h-full 
            grow
            items-end overflow-y-hidden 
            rounded-md bg-white px-2 
            py-1 font-bold
            leading-tight text-accent-red
            `}
          >
            <p className="overflow-hidden">{props.memberName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
