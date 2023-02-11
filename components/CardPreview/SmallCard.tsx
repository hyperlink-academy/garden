import { useCardViewer } from "components/CardViewerContext";
import { GripperBG } from "components/Gripper";
import { CalendarMedium, ExternalLink, Member } from "components/Icons";
import { useIndex, useMutations } from "hooks/useReplicache";
import { isUrl } from "src/isUrl";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const SmallCardBody = (props: { entityID: string } & Props) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");

  let member = useIndex.eav(props.entityID, "member/name");
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let image = useIndex.eav(props.entityID, "card/image");
  let date = useIndex.eav(props.entityID, "card/date");

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <BaseSmallCard
      {...props}
      title={title?.value}
      content={content?.value}
      imageUrl={imageUrl}
      isMember={isMember}
      memberName={member?.value}
      date={date?.value.value}
    />
  );
};

export const BaseSmallCard = (
  props: {
    title?: string;
    image?: string;
    memberName?: string;
    content?: string;
    isMember: boolean;
    imageUrl?: string;
    entityID?: string;
    date?: string;
  } & Omit<Props, "size" | "href">
) => {
  let url = props.content ? isUrl(props.content) : false;
  let date = props.date;
  let { authorized } = useMutations();
  let { open } = useCardViewer();
  return (
    <div
      onClick={() => {
        let cardView = document.getElementById("cardViewerWrapper");
        props.entityID && open({ entityID: props.entityID });
        cardView ? cardView.scrollIntoView({ behavior: "smooth" }) : null;
      }}
      className={`grid h-full w-full grid-cols-[max-content_auto] !bg-cover !bg-center !bg-no-repeat hover:cursor-pointer ${
        props.isMember ? "pr-1 pl-0 pt-2 pb-1" : "py-2 pr-3 pl-0"
      }`}
      style={{
        background: props.imageUrl ? `url(${props.imageUrl})` : "",
      }}
    >
      {authorized && props.dragHandleProps ? (
        <div
          className="gripper group pl-1 pr-2"
          {...props.dragHandleProps.attributes}
          {...props.dragHandleProps.listeners}
        >
          <GripperBG />
        </div>
      ) : (
        <div className={`${props.isMember ? "pl-1" : "pl-3"}`} />
      )}
      {/* Small Card Preview Content Wrapper (is it default or member?) */}
      {!props.isMember ? (
        /* Default Content (Member Content Further Down) */
        <div
          className="flex h-full w-full flex-col items-stretch gap-2 overflow-hidden"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preview Title Or Content */}
          <a className="h-full overflow-hidden">
            {!props.title ? (
              <small>
                <pre
                  className={`truncate whitespace-pre-wrap leading-tight ${
                    !props.image ? "" : "rounded-[3px] bg-white/75 px-1"
                  } `}
                >
                  {props?.content}
                </pre>
              </small>
            ) : (
              <div
                className={`text-ellipsis font-bold leading-tight text-grey-35  ${
                  !props.image ? "" : "rounded-[3px] bg-white/75 px-1"
                }`}
              >
                {props.title}
              </div>
            )}
          </a>

          {/* Small Card Preview - External Link */}
          {url ? (
            <a
              href={props.content}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="text-accent-blue ">
                <ExternalLink />
              </div>
            </a>
          ) : null}
          {/* Small Card Preview - Date */}
          {date ? (
            <div className="text-grey-35">
              <CalendarMedium />
            </div>
          ) : null}
        </div>
      ) : (
        // END OF DEFAULT CARD CONTENT, START OF MEMBER CARD CONTENT
        <div className="flex h-full w-full flex-col items-stretch gap-2 overflow-hidden">
          <div className="grid grid-cols-[auto_max-content] items-end text-white ">
            <Member />
            <small>member</small>
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
