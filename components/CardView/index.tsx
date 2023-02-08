import { Menu } from "@headlessui/react";

import {
  MoreOptionsTiny,
  Delete,
  DeckSmall,
  Member,
  CalendarMedium,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import {
  DateSection,
  MultipleReferenceSection,
  SingleTextSection,
} from "./Sections";
import { Backlinks } from "./Backlinks";
import { usePreserveScroll } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { MakeImage, ImageSection } from "./ImageSection";
import { useRouter } from "next/router";
import { useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const borderStyles = (args: { member: boolean }) => {
  switch (true) {
    //styles can be found is global.css
    case args.member:
      return `memberCardBorder`;
    default:
      return `defaultCardBorder`;
  }
};

const contentStyles = (args: { member: boolean }) => {
  switch (true) {
    case args.member:
      return `bg-white rounded-md ml-2 mr-2 mb-2 mt-0 px-3 pt-3 pb-6`;
    default:
      return `px-3 py-4 sm:px-4 sm:py-6`;
  }
};
export const CardView = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let memberName = useIndex.eav(props.entityID, "member/name");
  let { ref } = usePreserveScroll<HTMLDivElement>();
  let { session } = useAuth();

  return (
    <div className="flex h-full flex-col items-stretch">
      <Backlinks entityID={props.entityID} />
      <div
        className={`
        card
        no-scrollbar
        relative
        mx-auto       
        flex
        h-full w-full
        max-w-3xl grow
        flex-col items-stretch overflow-y-scroll
        ${borderStyles({
          member: !!memberName,
        })}
        `}
      >
        {!session?.loggedIn || !memberName ? null : (
          <>
            <div className="grid shrink-0 grid-cols-[auto_max-content] items-end px-2 pt-2 pb-1 text-white">
              <Member />
              <Link href={`/s/${memberName?.value}`}>
                <small className="justify-self-start">visit studio</small>
              </Link>
            </div>
          </>
        )}

        {/* CARD CONTENT HERE */}
        <div
          ref={ref}
          className={`
            cardContent
            no-scrollbar flex h-full          
            grow
            flex-col
            gap-6
            overflow-scroll
            ${contentStyles({
              member: !!memberName,
            })}
            `}
        >
          <div className="cardDefaultSection grid-auto-rows grid gap-3">
            <div>
              <div className="cardHeader grid grid-cols-[auto_max-content_max-content] gap-2">
                <Title entityID={props.entityID} />
                <div className="">
                  <CardMoreOptionsMenu
                    onDelete={props.onDelete}
                    entityID={props.entityID}
                    referenceFactID={props?.referenceFactID}
                  />
                </div>
              </div>
              <DateSection entityID={props.entityID} />
            </div>

            <DefaultTextSection entityID={props.entityID} />

            {/* display image, if we have one! */}
            <ImageSection entity={props.entityID} />
            {/* image icon - click to upload */}
            {/* TODO: finish making these + style em */}
            <AddSections entityID={props.entityID} />

            <DeckCardList entityID={props.entityID} />
          </div>
        </div>
        {/* END CARD CONTENT */}
      </div>
    </div>
  );
};

export const AddSections = (props: { entityID: string }) => {
  let { mutate, authorized } = useMutations();
  let date = useIndex.eav(props.entityID, "card/date");
  let [open, setOpen] = useState(false);

  if (!authorized) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 pt-2">
        <MakeImage entity={props.entityID} />
        {!date && (
          <button
            className="stroke-grey-55 text-grey-55 hover:stroke-accent-blue"
            onClick={() => {
              setOpen(!open);
            }}
          >
            <CalendarMedium className="stroke-accent-blue" />
          </button>
        )}
      </div>
      {open && !date && (
        <input
          onChange={(e) => {
            console.log(e.currentTarget.value);
            mutate("assertFact", {
              entity: props.entityID,
              attribute: "card/date",
              value: { type: "yyyy-mm-dd", value: e.currentTarget.value },
              positions: {},
            });
          }}
          type="date"
        />
      )}
    </div>
  );
};

const DefaultTextSection = (props: { entityID: string }) => {
  let { session } = useAuth();
  let { mutate } = useMutations();
  let spaceID = useSpaceID();
  return (
    <SingleTextSection
      id={`${props.entityID}-default-text-section}`}
      onPaste={async (e) => {
        let items = e.clipboardData.items;
        if (!items[0].type.includes("image") || !session.session) return;
        let image = items[0].getAsFile();
        if (!image) return;

        let res = await fetch(`${WORKER_URL}/space/${spaceID}/upload_file`, {
          headers: {
            "X-Authorization": session.session.id,
          },
          method: "POST",
          body: image,
        });
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
      entityID={props.entityID}
      section={"card/content"}
    />
  );
};

const Title = (props: { entityID: string }) => {
  let memberName = useIndex.eav(props.entityID, "member/name");
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let titleFact = memberName || cardTitle;
  return (
    <SingleTextSection
      onKeyPress={(e) => {
        if (e.key === "Enter") {
          let className = `${props.entityID}-default-text-section}`;
          let element = document.getElementById(className);
          element?.focus();
        }
      }}
      previewOnly={titleFact?.attribute === "member/name"}
      entityID={props.entityID}
      className="bg-inherit text-xl font-bold"
      section={titleFact?.attribute || "card/title"}
    />
  );
};

const DeckCardList = (props: { entityID: string }) => {
  return (
    <div className="flex flex-col justify-center">
      <MultipleReferenceSection
        entityID={props.entityID}
        section="deck/contains"
      />
    </div>
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
  onDelete?: () => void;
}) => {
  let { authorized, mutate, action } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");

  let { query: q } = useRouter();

  return !authorized || !!memberName ? null : (
    <Menu as="div" className="relative">
      <Menu.Button className={`pt-[6px]`}>
        <MoreOptionsTiny />
      </Menu.Button>
      <MenuContainer>
        <MenuItem
          onClick={async () => {
            action.start();

            await mutate("deleteEntity", { entity: props.entityID });
            props.onDelete?.();

            action.end();
          }}
        >
          <p className="font-bold text-accent-red">Delete FOREVER</p>
          <div className="text-accent-red">
            <Delete />
          </div>
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};
