import { Menu } from "@headlessui/react";

import {
  MoreOptionsTiny,
  Delete,
  Member,
  CalendarMedium,
  CardAdd,
  Send,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { sortByPosition } from "src/position_helpers";

import {
  AttachedCardSection,
  DateSection,
  SingleTextSection,
} from "./Sections";
import { Backlinks } from "./Backlinks";
import { usePreserveScroll } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { MakeImage, ImageSection } from "./ImageSection";
import { useRouter } from "next/router";
import { useState } from "react";
import { AddAttachedCard, CardStack } from "components/CardStack";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { ButtonSecondary } from "components/Buttons";
import { Discussion } from "./discussion";

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
  let [cardState, setCardState] = useState<"card" | "discussion">("card");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let { ref } = usePreserveScroll<HTMLDivElement>();

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
        {/* IF MEMBER CARD, INCLUDE LINK TO STUDIO  */}
        {!memberName ? null : (
          <div className="grid shrink-0 grid-cols-[auto_max-content] items-end px-2 pt-2 pb-1 text-white">
            <Member />
            <Link href={`/s/${memberName?.value}`}>
              <small className="justify-self-start">visit studio</small>
            </Link>
          </div>
        )}
        <div
          ref={ref}
          className={`
            cardContentAndDiscussion
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
          {cardState === "card" ? (
            <CardContent
              setCardState={() =>
                cardState === "card"
                  ? setCardState("discussion")
                  : setCardState("card")
              }
              {...props}
            />
          ) : (
            <Discussion
              setCardState={() =>
                cardState === "card"
                  ? setCardState("discussion")
                  : setCardState("card")
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const CardContent = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
  setCardState: () => void;
}) => {
  let memberName = useIndex.eav(props.entityID, "member/name");
  let cardCreator = useIndex.eav(props.entityID, "card/created-by");
  // returns reference…
  let cardCreatorName = useIndex.eav(
    cardCreator?.value.value as string,
    "member/name"
  )?.value;

  let { ref } = usePreserveScroll<HTMLDivElement>();
  let { session } = useAuth();

  return (
    <>
      {/* START CARD CONTENT */}
      <div className="cardContent grid-auto-rows grid gap-3">
        <div>
          <div className="cardHeader grid grid-cols-[auto_max-content_max-content] gap-2">
            <Title entityID={props.entityID} />
            {cardCreatorName ? (
              <div className="lightBorder self-start rounded-md py-1 px-2 text-sm text-grey-35">
                {cardCreatorName}
              </div>
            ) : null}
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

        {/* show the image and attached cards if any */}
        <ImageSection entityID={props.entityID} />
        <AttachedCardSection entityID={props.entityID} />

        {/* this handles the triggers to add cards, image, and date! */}
        <SectionAdder entityID={props.entityID} />
      </div>
      {/* END CARD CONTENT */}
      {/* START CARD THOUGHTS */}
      <div className="cardThoughts flex w-full flex-col gap-4">
        <p className="font-bold text-grey-35">Thoughts</p>
        <div>
          <textarea
            placeholder="add your thoughts..."
            className="h-32 w-full"
          ></textarea>
          <div className="flex items-center justify-between text-grey-55">
            <CardAdd />
            <ButtonSecondary icon={<Send />} />
          </div>
        </div>
        <Divider />
        <Thought setCardState={props.setCardState} />
      </div>
    </>
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

export const SectionAdder = (props: { entityID: string }) => {
  let { mutate, authorized } = useMutations();
  let date = useIndex.eav(props.entityID, "card/date");
  let [open, setOpen] = useState(false);
  let attachedCards = useIndex.eav(props.entityID, "deck/contains");

  if (!authorized) return null;
  return (
    <div className="flex flex-col gap-2 text-grey-55">
      <div className="flex gap-2 pt-2">
        <MakeImage entity={props.entityID} />
        {!date && (
          <button
            className="hover:text-accent-blue"
            onClick={() => {
              setOpen(!open);
            }}
          >
            <CalendarMedium />
          </button>
        )}

        {attachedCards && attachedCards.length !== 0 ? null : (
          <AddAttachedCard
            parent={props.entityID}
            attribute="deck/contains"
            positionKey="eav"
          >
            <div className="hover:text-accent-blue">
              <CardAdd />
            </div>
          </AddAttachedCard>
        )}
      </div>
      {open && !date && (
        <input
          onChange={(e) => {
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

export const Thought = (props: { setCardState?: () => void }) => {
  return (
    <button
      onClick={() => {
        !props.setCardState ? null : props.setCardState();
      }}
      className="lightBorder group flex flex-col gap-1 py-2 px-3 text-left hover:border-accent-blue"
    >
      <div className="flex w-full justify-between gap-2 text-grey-55">
        <small className="font-bold">celine</small>
        <small>3/3/23</small>
      </div>
      <div className="text-grey-35">
        This is my content I love make comments about other people's shit
      </div>
      <small className=" place-self-end text-grey-80 underline group-hover:text-accent-blue">
        2 replies
      </small>
    </button>
  );
};
