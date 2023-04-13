import { SingleReactionPreview } from "components/CardView/Reactions";
import { useCardViewer } from "components/CardViewerContext";
import { ExternalLink, Member } from "components/Icons";
import { useReactions } from "hooks/useReactions";
import { useMutations } from "hooks/useReplicache";
import { isUrl } from "src/isUrl";
import { Props } from "./index";

export const SmallCardBody = (props: { entityID: string } & Props) => {
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
  } & Omit<Props, "size" | "href" | "data">
) => {
  let url = props.content ? isUrl(props.content) : false;

  let { authorized } = useMutations();
  let { open } = useCardViewer();
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
        props.isMember ? "pr-1 pl-2 pt-2 pb-1" : "py-2 pr-3 pl-2"
      }`}
      style={{
        background: props.imageUrl ? `url(${props.imageUrl})` : "",
      }}
    >
      {/* Small Card Preview Content Wrapper (is it default or member?) */}
      {!props.isMember ? (
        /* Default Content (Member Content Further Down) */
        <div
          className="flex h-full w-full flex-col items-stretch gap-1 overflow-hidden"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preview Title Or Content */}
          <a className="h-full overflow-hidden">
            {!props.title ? (
              <small>
                <pre
                  className={`w-fit truncate whitespace-pre-wrap leading-tight ${
                    !props.imageUrl ? "" : "rounded-[3px] bg-white/75 px-1"
                  } `}
                >
                  {props?.content}
                </pre>
              </small>
            ) : (
              <div
                className={`w-fit text-ellipsis font-bold leading-tight text-grey-35 ${
                  !props.imageUrl ? "" : "rounded-[3px] bg-white px-1"
                }`}
              >
                {props.title}
              </div>
            )}
          </a>

          {/* Small Card Preview - External Link */}
          {/* NB: we COULD also turn this off */}
          {url ? (
            <a
              className="fixed -bottom-[12px] left-[6px] rounded-md border border-grey-80 bg-white p-1 text-accent-blue"
              href={props.content}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ExternalLink />
            </a>
          ) : null}

          {/* Small Card Preview - Date */}
          {/* NB: turning off to simplify! */}
          {/* {date ? (
            <div className="text-grey-35">
              <CalendarMedium />
            </div>
          ) : null} */}

          {/* Small Card Preview - Reactions */}
          {props.reactions && props.reactions.length > 0 ? (
            <div className="fixed -bottom-[12px] right-[24px] flex items-center gap-1">
              {props.reactions.slice(0, 1).map(([reaction, data]) => {
                if (props.entityID)
                  return (
                    <SingleReactionPreview
                      key={reaction}
                      {...data}
                      reaction={reaction}
                      entityID={props.entityID}
                    />
                  );
              })}
              {props.reactions.length > 1 ? (
                <span className="rounded-md border border-grey-80 bg-white py-0.5 px-2 text-sm text-grey-55">
                  {`+${props.reactions.length - 1}`}
                </span>
              ) : (
                ""
              )}
            </div>
          ) : null}
        </div>
      ) : (
        // END OF DEFAULT CARD CONTENT, START OF MEMBER CARD CONTENT
        <div className="flex h-full w-full flex-col items-stretch gap-2 overflow-hidden">
          <div className="grid grid-cols-[auto_max-content] items-end text-white ">
            <Member />
            <small className="mr-0.5 italic">member</small>
          </div>
          <div
            className={`
            flex h-full 
            grow
            items-end overflow-y-hidden 
            rounded-md bg-white py-1 
            px-2 font-bold
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
