import { Menu } from "@headlessui/react";

import {
  MoreOptions,
  Delete,
  DeckSmall,
  Member,
  CardAdd,
  Print,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import {
  MultipleReferenceSection,
  Sections,
  SingleTextSection,
} from "./Sections";
import { AddSection } from "./AddSection";
import { Backlinks } from "./Backlinks";
import { spacePath, usePreserveScroll } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { MakeImage, ImageSection } from "./ImageSection";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { flag } from "data/Facts";
import { MessageInput, Messages } from "pages/s/[studio]/s/[space]/chat";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const borderStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    //styles can be found is global.css
    case args.member:
      return `memberCardBorder`;
    case args.deck:
      return `defaultCardBorder`;

    default:
      return `defaultCardBorder`;
  }
};

const contentStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    case args.member:
      return `bg-white rounded-md ml-2 mr-2 mb-2 mt-0 px-3 pt-3 pb-6`;
    case args.deck:
      return `px-3 py-4 sm:px-4 sm:py-6`;
    default:
      return `px-3 py-4 sm:px-4 sm:py-6`;
  }
};
export const CardView = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let isDeck = useIndex.eav(props.entityID, "deck");
  let isChat = useIndex.eav(props.entityID, "chat");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let { ref } = usePreserveScroll<HTMLDivElement>();
  let { session } = useAuth();

  // TESTING HIDDEN FEATURE - customizable card styles
  // get sections at top level to check for style customizations
  let text_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_text_color" as "arbitrarySectionStringType"
  )?.value;
  let bg_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_bg_color" as "arbitrarySectionStringType"
  )?.value;
  let border_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_border_color" as "arbitrarySectionStringType"
  )?.value;
  let border_width_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_border_width" as "arbitrarySectionStringType"
  )?.value;
  if (isChat) return <ChatCard {...props} />;

  return (
    <div className="flex flex-col items-stretch h-full">
      <Backlinks entityID={props.entityID} />
      <div
        className={`
        card
        grow
        relative
        overflow-y-scroll       
        no-scrollbar
        max-w-3xl mx-auto
        w-full h-full
        flex flex-col items-stretch
        ${borderStyles({
          deck: !!isDeck,
          member: !!memberName,
        })}
        `}
        style={{
          color: text_color_value ? text_color_value : undefined,
          backgroundColor: bg_color_value ? bg_color_value : undefined,
          borderColor: border_color_value ? border_color_value : undefined,
          borderWidth: border_width_value ? border_width_value : undefined,
        }}
      >
        {!session?.loggedIn || !memberName ? null : (
          <>
            <div className="grid grid-cols-[auto_max-content] shrink-0 items-end text-white px-2 pt-2 pb-1">
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
            flex flex-col gap-6          
            no-scrollbar
            h-full
            grow
            overflow-scroll
            ${contentStyles({
              deck: !!isDeck,
              member: !!memberName,
            })}
            `}
        >
          <div className="cardDefaultSection grid grid-auto-rows gap-3">
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
            <DefaultTextSection entityID={props.entityID} />

            <div className="pb-2">
              <ImageSection entity={props.entityID} />
            </div>
            <DeckCardList entityID={props.entityID} />

            <div className="flex gap-2 pt-2">
              <MakeImage entity={props.entityID} />
            </div>
          </div>

          <Sections entityID={props.entityID} />

          <AddSection cardEntity={props.entityID} />
        </div>
        {/* END CARD CONTENT */}
      </div>
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

const ChatCard = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let { memberEntity, mutate } = useMutations();
  useEffect(() => {
    if (memberEntity)
      mutate("updateReadState", { member: memberEntity, chat: props.entityID });
  }, [memberEntity]);
  return (
    <div className={`chatCardWrapper grow h-full relative`}>
      <div className="chatCardBackground absolute top-0 bottom-0 left-0 right-0 chatCardBorder">
        <div className="chatCardContent flex flex-col  h-full px-3 pt-4 sm:px-4 sm:pt-6 pb-1">
          <div className="cardHeader grid grid-cols-[auto_max-content_max-content] gap-2">
            <div className="pb-2">
              <Title entityID={props.entityID} />
            </div>
            <div className="">
              <CardMoreOptionsMenu
                onDelete={props.onDelete}
                entityID={props.entityID}
                referenceFactID={props?.referenceFactID}
              />
            </div>
          </div>
          <Messages topic={props.entityID} />
          <MessageInput id={props.entityID} topic={props.entityID} />
        </div>
      </div>
    </div>
  );
};

const MakeDeck = (props: { entity: string }) => {
  let { authorized, mutate } = useMutations();
  let cards = useIndex.eav(props.entity, "deck/contains");
  let isDeck = useIndex.eav(props.entity, "deck");

  if (cards && cards.length > 0) return null;
  if (!authorized) return null;
  return isDeck ? null : (
    <button
      onClick={() => {
        mutate("assertFact", {
          entity: props.entity,
          attribute: "deck",
          value: flag(),
          positions: {},
        });
      }}
    >
      <CardAdd
        className={
          isDeck
            ? `text-accent-blue hover:text-grey-55`
            : `text-grey-55 hover:text-accent-blue`
        }
      />
    </button>
  );
};

const Title = (props: { entityID: string }) => {
  let memberName = useIndex.eav(props.entityID, "member/name");
  let botName = useIndex.eav(props.entityID, "bot/name");
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let titleFact = memberName || botName || cardTitle;
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
      className="text-xl font-bold bg-inherit"
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
  let { authorized, mutate } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");

  let { query: q } = useRouter();

  return !authorized || !!memberName ? null : (
    <Menu as="div" className="relative">
      <Menu.Button className={`pt-[6px]`}>
        <MoreOptions />
      </Menu.Button>
      <MenuContainer>
        {!props?.referenceFactID ? null : (
          <MenuItem
            onClick={
              !authorized
                ? undefined
                : () => {
                    mutate("retractFact", {
                      id: props?.referenceFactID as string,
                    });
                  }
            }
          >
            <p>Remove from Deck</p>
            <DeckSmall />
          </MenuItem>
        )}

        <MenuItem>
          <Link
            href={`${spacePath(q.space, q.studio)}/c/${props.entityID}/print`}
          >
            Print
          </Link>
          <Print />
        </MenuItem>
        <div className="py-2">
          <Divider />
        </div>

        {/* TODO: wire up delete card (and add confirmation?) */}
        {/* TODO: check if deck card; if so display "Delete Deck…"  */}

        <MenuItem
          onClick={() => {
            mutate("deleteEntity", { entity: props.entityID });
            props.onDelete?.();
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
