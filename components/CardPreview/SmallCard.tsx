import { useCardViewer } from "components/CardViewerContext";
import { GripperBG } from "components/Gripper";
import { ExternalLink, Member } from "components/Icons";
import { useReadState } from "hooks/useReadState";
import { useIndex, useMutations } from "hooks/useReplicache";
import { isUrl } from "src/isUrl";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const SmallCardBody = (props: { entityID: string } & Props) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let read = useReadState(props.entityID);

  let member = useIndex.eav(props.entityID, "member/name");
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let image = useIndex.eav(props.entityID, "card/image");

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
      read={read}
      memberName={member?.value}
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
    read: boolean;
  } & Omit<Props, "size" | "href">
) => {
  let url = props.content ? isUrl(props.content) : false;
  let { authorized } = useMutations();
  let { open } = useCardViewer();
  return (
    <div
      onClick={() => props.entityID && open({ entityID: props.entityID })}
      className={`w-full h-full grid grid-cols-[max-content_auto] !bg-cover !bg-center !bg-no-repeat hover:cursor-pointer ${
        props.isMember ? "pr-1 pl-0 pt-2 pb-1" : "pr-3 pl-0 py-2"
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
        /* Default Content (Member Content Futher DOwn) */
        <div
          className="w-full h-full flex flex-col gap-2 items-stretch overflow-hidden"
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {/* Small Card Preivew Title Or Contnet */}
          <a className="h-full overflow-hidden">
            {!props.title ? (
              <small>
                <pre
                  className={`whitespace-pre-wrap truncate leading-tight ${
                    !props.image ? "" : "rounded-[3px] px-1 bg-white/75"
                  } `}
                >
                  {props?.content}
                </pre>
              </small>
            ) : (
              <div
                className={`leading-tight text-ellipsis text-grey-35 font-bold  ${
                  !props.image ? "" : "rounded-[3px] px-1 bg-white/75"
                }`}
              >
                {props.title}
              </div>
            )}
            {!props.read ? (
              <div className="rounded-full bg-accent-red w-1 h-1" />
            ) : null}
          </a>

          {/* Small Card Preview External Link */}
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
          ) : (
            <div />
          )}
        </div>
      ) : (
        // END OF DEFAULT CARD CONTENT, START OF MEMBER CARD CONTENT
        <div className="w-full h-full flex flex-col gap-2 items-stretch overflow-hidden">
          <div className="grid grid-cols-[auto_max-content] items-end text-white ">
            <Member />
            <small>member</small>
          </div>
          <div
            className={`
            py-1 px-2 
            grow
            bg-white rounded-md 
            text-accent-red font-bold leading-tight 
            h-full overflow-y-hidden
            flex items-end
            `}
          >
            <p className="overflow-hidden">{props.memberName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
