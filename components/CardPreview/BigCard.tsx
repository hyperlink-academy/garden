import { SingleTextSection } from "components/CardView/Sections";
import { GripperBG } from "components/Gripper";
import { GoToPage } from "components/Icons";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useCardViewer } from "pages/s/[studio]/s/[space]";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const BigCardBody = (props: { entityID: string } & Props) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let { session } = useAuth();
  let spaceID = useSpaceID();
  let sections = useIndex.eav(props.entityID, "card/section");
  let image = useIndex.eav(props.entityID, "card/image");
  let { mutate, authorized } = useMutations();

  let { open } = useCardViewer();

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className={`w-full overflow-hidden h-full flex flex-row pl-0  ${
        isMember ? "py-2 pr-2" : "py-2 pr-3"
      }`}
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      {/* Gripper  */}
      <div className="pl-1 pr-2 text-grey-80">
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
      <div className="grid grid-rows-[max-content_auto_max-content] w-full">
        {/* Big Card Preview Title and GoTo Button*/}
        <div className={`flex gap-2 items-start`}>
          <SingleTextSection
            entityID={props.entityID}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                let element = document.getElementById(
                  `${props.entityID}-${props.factID}-text-section`
                );
                element?.focus();
              }
            }}
            previewOnly={isMember}
            section={isMember ? "member/name" : "card/title"}
            placeholderOnHover={true}
            placeholder="Untitled"
            className={`font-bold text-md grow ${
              isMember ? "text-white" : "text-grey-35"
            } ${!image ? "" : "rounded-[3px] px-1 bg-white/75"}`}
          />
          {isMember ? <div className="shrink-0 text-white">member</div> : ""}
          <div
            onClick={() => open({ entityID: props.entityID })}
            className="hover:cursor-pointer pt-1"
          >
            <a className={`${isMember ? "text-white" : "text-accent-blue"}`}>
              <GoToPage />
            </a>
          </div>
        </div>

        {/* Big Card Preview Default Content */}
        <div
          className={`${
            isMember ? "bg-white rounded-md p-2 pt-1 text-accent-red mt-1" : ""
          }`}
        >
          {!image ? null : (
            <img
              src={`${imageUrl}`}
              className="py-2 px-1  max-w-full max-h-[600px]"
            />
          )}
          <SingleTextSection
            id={`${props.entityID}-${props.factID}-text-section`}
            entityID={props.entityID}
            onPaste={async (e) => {
              let items = e.clipboardData.items;
              if (!items[0].type.includes("image") || !session.session) return;
              let image = items[0].getAsFile();
              if (!image) return;

              let res = await fetch(
                `${WORKER_URL}/space/${spaceID}/upload_file`,
                {
                  headers: {
                    "X-Authorization": session.session.id,
                  },
                  method: "POST",
                  body: image,
                }
              );
              let data = (await res.json()) as
                | { success: false }
                | { success: true; data: { id: string } };
              if (!data.success) return;
              await mutate("assertFact", {
                entity: props.entityID,
                attribute: "card/image",
                value: { type: "file", id: data.data.id, filetype: "image" },
                positions: {},
              });
            }}
            section="card/content"
            placeholderOnHover={true}
            className={`whitespace-pre-wrap truncate leading-tight pt-1  ${
              !image ? "" : "rounded-[3px] px-1 bg-white/75"
            } `}
          />
        </div>

        {/* Big Card Preview Resize and Rotate */}
        {sections !== null && sections.length === 0 ? (
          <div />
        ) : (
          <small
            className={`SectionCounter text-grey-80 ${
              isMember ? "hover:text-white" : "hover:text-accent-blue"
            } hover:underline pb-1 pt-2 `}
          >
            <a onClick={() => open({ entityID: props.entityID })}>
              + {sections?.length} sections
            </a>
          </small>
        )}
      </div>
    </div>
  );
};