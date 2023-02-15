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
import { AddAttachedCard } from "components/CardStack";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { Discussion } from "./Discussion";

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
              cardState={cardState}
              toggleCardState={() =>
                cardState === "card"
                  ? setCardState("discussion")
                  : setCardState("card")
              }
              {...props}
            />
          ) : (
            <Discussion
              cardState={cardState}
              toggleCardState={() =>
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
  toggleCardState: () => void;
  cardState: string;
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
  let [thoughtInputFocus, setThoughtInputFocus] = useState(false);

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

      <div className="cardThoughts flex w-full flex-col gap-3">
        <Divider />
        <div className="flex flex-col gap-2 pt-3">
          <textarea
            placeholder="add a comment..."
            onFocus={() => setThoughtInputFocus(true)}
            onBlur={() => setThoughtInputFocus(false)}
            className={`${
              thoughtInputFocus ? "test-bg-pink h-32" : "h-10"
            } w-full border-grey-80`}
            id="thoughtInput"
          ></textarea>
          {!thoughtInputFocus ? null : (
            <div className="flex items-center justify-between text-grey-55 ">
              <div className="hover:text-accent-blue">
                <CardAdd />
              </div>
              <ButtonPrimary icon={<Send />} />
            </div>
          )}
        </div>
        <Thought
          toggleCardState={props.toggleCardState}
          cardState={props.cardState}
        />
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

export const Thought = (props: {
  toggleCardState?: () => void;
  cardState: string;
}) => {
  return (
    <button
      onClick={() => {
        !props.toggleCardState ? null : props.toggleCardState();
      }}
      className={`group flex flex-col gap-1 rounded-md border py-2 px-3 text-left ${
        props.cardState === "discussion"
          ? "border-grey-80 bg-bg-blue text-grey-35"
          : " border-transparent text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-grey-35"
      } `}
    >
      <div className="flex w-full items-baseline gap-2">
        <div className="font-bold">celine</div>
        <div className="text-sm">3/3/23</div>
      </div>
      <div className="">
        This is my content I love make comments about other people's shit
      </div>
      <small
        className={`place-self-end  ${
          props.cardState === "discussion"
            ? ""
            : "underline group-hover:text-accent-blue"
        }`}
      >
        2 replies
      </small>
    </button>
  );
};
