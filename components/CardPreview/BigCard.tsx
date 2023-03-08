import { Backlinks } from "components/CardView/Backlinks";
import {
  SingleReaction,
  SingleReactionPreview,
} from "components/CardView/Reactions";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import { GripperBG } from "components/Gripper";
import { CloseLinedTiny } from "components/Icons";
import { useReactions } from "hooks/useReactions";
import { useIndex, useMutations } from "hooks/useReplicache";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const BigCardBody = (props: { entityID: string } & Props) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let image = useIndex.eav(props.entityID, "card/image");

  let reactions = useReactions(props.entityID);

  let { authorized } = useMutations();
  let { open } = useCardViewer();

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className={`CardPreviewContent flex h-full grow flex-row overflow-hidden pl-0  ${
        isMember ? "py-2 pr-2" : "py-2 pr-3"
      }`}
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      {/* Gripper  */}
      <div className="cardPreviewGripper pl-1 pr-2 text-grey-80">
        {authorized && props.dragHandleProps ? (
          <div className="h-full">
            <GripperBG
              {...props.dragHandleProps.attributes}
              {...props.dragHandleProps.listeners}
            />
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Big Card Preview Content Wrapper */}
      <div
        className="cardPreview flex w-full flex-col hover:cursor-pointer"
        onClick={() => {
          let cardView = document.getElementById("cardViewerWrapper");
          open({ entityID: props.entityID });
          cardView ? cardView.scrollIntoView({ behavior: "smooth" }) : null;
        }}
      >
        {/* Big Card Preview Title and GoTo Button*/}
        <div className={`cardPreviewHeader flex gap-2`}>
          <SingleTextSection
            entityID={props.entityID}
            previewOnly
            section={isMember ? "member/name" : "card/title"}
            placeholderOnHover={true}
            placeholder="Untitled"
            className={`cardPreviewTitle text-md grow font-bold ${
              isMember ? "text-white" : "text-grey-35"
            } ${!image ? "" : "rounded-[3px] bg-white/75 px-1"}`}
          />
          {isMember ? <div className="shrink-0 text-white ">member</div> : ""}
          {!props.outerControls && props.onDelete && authorized ? (
            <button
              className="text-grey-80 hover:text-grey-15"
              onClick={(e) => {
                e.stopPropagation();
                props.onDelete?.();
              }}
            >
              <CloseLinedTiny width={12} height={12} />
            </button>
          ) : null}
        </div>
        {props.showRelated && <Backlinks entityID={props.entityID} />}

        {/* Big Card Preview Default Content */}
        <div
          className={` cardPreviewDefaultContent ${
            isMember ? "mt-1 rounded-md bg-white p-2 pt-1 text-accent-red" : ""
          }`}
        >
          {!image || props.hideContent ? null : (
            <img
              src={`${imageUrl}`}
              className="max-h-[600px] max-w-full  py-2 px-1"
            />
          )}
          {!props.hideContent && (
            <SingleTextSection
              previewOnly
              id={`${props.entityID}-${props.factID}-text-section`}
              entityID={props.entityID}
              section="card/content"
              placeholderOnHover={true}
              className={`cardPreviewDefaultTextContent truncate whitespace-pre-wrap pt-1 leading-tight  ${
                !image ? "" : "rounded-[3px] bg-white/75 px-1"
              } `}
            />
          )}
        </div>
        {/* Reactions */}
        {reactions.length > 0 ? (
          <div className="flex w-full flex-row items-center gap-1 pt-2">
            {reactions.slice(0, 3).map(([reaction, data]) => {
              return (
                <SingleReactionPreview
                  {...data}
                  reaction={reaction}
                  entityID={props.entityID}
                />
              );
            })}
            {reactions.length > 3 ? (
              <span className="rounded-md border border-grey-80 bg-white py-0.5 px-2 text-sm">
                <em>{`+${reactions.length - 3}…`}</em>
              </span>
            ) : (
              ""
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
