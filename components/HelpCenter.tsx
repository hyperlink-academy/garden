"use client";
import { Tab } from "@headlessui/react";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  CloseLinedTiny,
  DisclosureCollapseTiny,
  DisclosureExpandTiny,
  Settings,
} from "./Icons";
import { ModalFixedHeight } from "./Layout";
import { isAppleDevice } from "@react-aria/utils";
import { Disclosure } from "@headlessui/react";
import Link from "next/link";

export const HelpModal = (props: { open: boolean; onClose: () => void }) => {
  return (
    <ModalFixedHeight open={props.open} onClose={props.onClose}>
      <div className="jusify-between flex items-center">
        <h3 className="m-auto grow">Help Docs</h3>
        <button
          onClick={() => props.onClose()}
          className="shrink-0 grow-0 text-grey-55 hover:text-accent-blue"
        >
          <CloseLinedTiny />
        </button>
      </div>

      <HelpDocs />
    </ModalFixedHeight>
  );
};

const DividerTiny = () => (
  <div className="m-auto my-1 rounded-md bg-accent-gold p-1 sm:my-2 sm:p-2">
    <div className="rounded-md bg-accent-red p-1 sm:p-2">
      <div className="rounded-md bg-accent-blue p-0.5 sm:p-1"></div>
    </div>
  </div>
);

export const HelpDocs = () => {
  let query = useSearchParams();
  let tab = query?.get("tab") || "handbook";
  let [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(() => {
      return tab
        ? [
            "handbook",
            "shortcuts",
            "roadmap",
            "changelog",
            "examples",
            "app",
          ].indexOf(tab as string)
        : 0;
    });
  }, [tab]);

  return (
    <>
      <Tab.Group
        manual
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
      >
        <Tab.List className="m-auto flex flex-wrap gap-1">
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`rounded-md border p-2 ${
                  selected
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "text-black border-grey-80 bg-white hover:bg-bg-blue"
                }`}
              >
                Handbook
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`rounded-md border p-2 ${
                  selected
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "text-black border-grey-80 bg-white hover:bg-bg-blue"
                }`}
              >
                Shortcuts
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`rounded-md border p-2 ${
                  selected
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "text-black border-grey-80 bg-white hover:bg-bg-blue"
                }`}
              >
                Roadmap
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`rounded-md border p-2 ${
                  selected
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "text-black border-grey-80 bg-white hover:bg-bg-blue"
                }`}
              >
                Changelog
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`rounded-md border p-2 ${
                  selected
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "text-black border-grey-80 bg-white hover:bg-bg-blue"
                }`}
              >
                Examples
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`rounded-md border p-2 ${
                  selected
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "text-black border-grey-80 bg-white hover:bg-bg-blue"
                }`}
              >
                Get the App
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <HelpHandbook />
          </Tab.Panel>
          <Tab.Panel>
            <HelpShortcuts />
          </Tab.Panel>
          <Tab.Panel>
            <HelpRoadmap />
          </Tab.Panel>
          <Tab.Panel>
            <HelpChangelog />
          </Tab.Panel>
          <Tab.Panel>
            <HelpExampleSpaces />
          </Tab.Panel>
          <Tab.Panel>
            <HelpAppInfo />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

// HELP CONTENT SECTIONS

const HelpHandbook = () => {
  return (
    <div className="flex flex-col gap-4">
      <p>
        Welcome! Hyperlink is a place to do meaningful things — creative
        projects; book clubs; learning groups — together on the internet.
      </p>
      <p>This short guide explains how the app works.</p>
      <p>
        Questions? Suggestions?{" "}
        <a
          href="mailto:contact@hyperlink.academy"
          className="font-bold text-accent-blue"
        >
          Email us
        </a>{" "}
        any time :)
      </p>
      <HelpDisclosureSection>
        <HelpDisclosure name="10 second TL;DR">
          <p>The core pieces of Hyperlink:</p>
          <ul>
            <li>
              make <strong>Spaces</strong> for projects and invite others to
              collaborate
            </li>
            <li>
              make <strong>cards</strong> for important things, and organize
              Themes in <strong>rooms</strong>
            </li>
            <li>
              use <strong>Studios</strong> for groups to collect many spaces
            </li>
          </ul>
        </HelpDisclosure>
        <HelpDisclosure name="Spaces">
          <p>
            Spaces are collaborative workspaces — a mix of notes, chat, and
            project management.
          </p>
          {/* great for projects, gatherings, or explorations */}
          <p>
            You can make Spaces just for yourself, and invite others to join
            them.
          </p>
          <p>Spaces can live in multiple Studios — see below!</p>
          <p>
            Over time your Spaces on Hyperlink form an ecosystem: seedlings,
            active projects, archives, communities of collaborators.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Studios">
          <p>
            Studios are places for groups — like clubs, cohorts, or teams — to
            work together and share many Spaces.
          </p>
          <ul>
            <li>Schools might use Spaces for different classes or cohorts</li>
            <li>
              Clubs might use Spaces for each participant&apos;s creative
              projects
            </li>
            <li>
              Team might work on lots of projects together in different Spaces
            </li>
          </ul>

          <p>Studio creators can configure an About page and a few settings.</p>
          <p>
            Studio members can add Spaces, and comment / react on other Spaces
            in the Studio.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Rooms">
          <p>Rooms help you stay organized within a Space.</p>
          <ul>
            <li>Collection and canvas rooms: to arrange and work with cards</li>
            <li>Chat rooms: like channels in Slack or Discord (more below!)</li>
            <li>
              Search, Unreads, and Calendar: special rooms that can&apos;t be
              edited
            </li>
          </ul>
          <p>
            You can create as many rooms as you like, and rename / reorder them
            in the sidebar.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Cards">
          <p>
            Cards represent meaningful things in a Space, like ideas, tasks, and
            questions.
          </p>
          <p>
            They&apos;re like little modular documents — each card has a title,
            text area, and chat section by default, and you can add images,
            reactions, and links to other cards.
          </p>
          <p>
            You can attach cards, or reference them inline, wiki-style; you can
            also see other places that reference a card in backlinks.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Membership & Permissions">
          <p>Creators of a Space or Studio can invite other people to join!</p>
          <ul>
            <li>
              Spaces: all members can create and edit cards, and invite others;
              only the creator can delete a Space
            </li>
            <li>
              Studios: members can add Spaces, and comment / react in other
              Spaces; only the creator can edit About and Settings, and delete
              the Studio
            </li>
          </ul>
        </HelpDisclosure>
        <HelpDisclosure name="Chat">
          <p>
            Hyperlink is all about collaboration — doing things and talking
            about them; sharing and encouraging each other.
          </p>
          <p>There are two ways to use chat in Hyperlink:</p>
          <ul>
            <li>
              Chat rooms show in the sidebar, and are like general channels for
              a Space to share
            </li>
            <li>
              Cards each have their own section for chat, for specific
              conversations or comments about anything
            </li>
          </ul>
        </HelpDisclosure>
        <HelpDisclosure name="Notifications">
          <p>
            New things in your Spaces that you haven&apos;t yet seen appear with
            a glowing border.
          </p>
          <p>
            This bubbles up, so new cards will glow, as well as rooms
            they&apos;re in, and Spaces from your homepage or Studios
            they&apos;re in.
          </p>
          <p>
            You can also get push notifications with our web app; see{" "}
            <Link href="/docs?tab=app" className="font-bold text-accent-blue">
              Get the App
            </Link>
            !
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Collaboration">
          <p>
            Hyperlink has some special features when you&apos;re in a Space
            together with others!
          </p>
          <p>
            Multiplayer presence: see who else is in a Space with you, and what
            cards they&apos;re on.
          </p>
          <p>
            Audio calls: hang and talk together with others in a Space (one call
            per Space)
          </p>
        </HelpDisclosure>
      </HelpDisclosureSection>
    </div>
  );
};

const HelpShortcuts = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* <p>
        An evolving list of shortcuts you may find helpful in using Hyperlink!
      </p> */}

      <h4>text editing</h4>
      <ul>
        <li>
          start a line with <TextString>#</TextString> or{" "}
          <TextString>##</TextString> for headers
        </li>
        <li>
          <TextString>[[</TextString> and search to inline link to a card
        </li>
        <li>
          wrap in <TextString>*</TextString> or{" "}
          <UnicodeKeyboardKey>{isAppleDevice() ? "⌘" : "⌃"}</UnicodeKeyboardKey>{" "}
          + <KeyboardKey>i</KeyboardKey> for italic
        </li>
        <li>
          wrap in <TextString>**</TextString> or{" "}
          <UnicodeKeyboardKey>{isAppleDevice() ? "⌘" : "⌃"}</UnicodeKeyboardKey>{" "}
          + <KeyboardKey>b</KeyboardKey> for bold
        </li>
        <li>
          wrap in <TextString>==</TextString> for highlight
        </li>
        <li>
          wrap in <TextString>~~</TextString> for strikethrough
        </li>
        <li>
          wrap in <TextString>`</TextString> for inline code
        </li>
        <li>
          start a line with <TextString>&gt;</TextString> for blockquote
        </li>
      </ul>

      <h4>chat & comments</h4>
      <ul>
        <li>
          <UnicodeKeyboardKey>⏎</UnicodeKeyboardKey> to send a message
        </li>
        <li>
          <UnicodeKeyboardKey>⇧</UnicodeKeyboardKey> +{" "}
          <UnicodeKeyboardKey>⏎</UnicodeKeyboardKey> for a line break
        </li>
      </ul>

      <h4>rooms & cards</h4>
      <ul>
        <li>
          <UnicodeKeyboardKey>⌥</UnicodeKeyboardKey> +{" "}
          <UnicodeKeyboardKey>↑</UnicodeKeyboardKey> and{" "}
          <UnicodeKeyboardKey>↓</UnicodeKeyboardKey> to switch rooms
        </li>
        <li>
          <UnicodeKeyboardKey>⇧</UnicodeKeyboardKey> +{" "}
          <UnicodeKeyboardKey>↑</UnicodeKeyboardKey> and{" "}
          <UnicodeKeyboardKey>↓</UnicodeKeyboardKey> to navigate between cards
          in a room
        </li>
        <li>
          <i>canvas</i>:{" "}
          <UnicodeKeyboardKey>{isAppleDevice() ? "⌘" : "⌃"}</UnicodeKeyboardKey>{" "}
          + click for new card
        </li>
        <li>
          <i>collection</i>: drag to reorder cards
        </li>
        <li>drag to reorder rooms in sidebar</li>
        <li>drag a card onto another to add it as a linked card</li>
      </ul>

      <h4>general</h4>
      <ul>
        <li>
          <UnicodeKeyboardKey>{isAppleDevice() ? "⌘" : "⌃"}</UnicodeKeyboardKey>{" "}
          + <KeyboardKey>z</KeyboardKey> to undo
        </li>
        <li>
          <UnicodeKeyboardKey>{isAppleDevice() ? "⌘" : "⌃"}</UnicodeKeyboardKey>{" "}
          + <UnicodeKeyboardKey>⇧</UnicodeKeyboardKey> +{" "}
          <KeyboardKey>z</KeyboardKey> = redo
        </li>
      </ul>
    </div>
  );
};

const HelpRoadmap = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2>Themes & Focus Areas</h2>
      <p className="">
        Use cases we&apos;re prioritizing; areas where we want Hyperlink to
        shine:
      </p>
      <HelpDisclosureSection>
        <HelpDisclosure name="Hyperlink for Clubs">
          <p>
            Currently running experiments with internet clubs, and we want to
            make the app even better here — it should give us great ways to
            bring groups of people together for creative work and learning.
          </p>
          <p>Some things this might include:</p>
          <ul>
            <li>
              More ways of representing key info: rich text, multimedia cards,
              etc.
            </li>
            <li>
              Surfacing and sharing activity to keep momentum going; things
              should feel active and dynamic
            </li>
            <li>
              Making Studios more powerful, e.g. with an activity log or chat
              and cards at the top level
            </li>
            <li>
              Built-in ways to send a group email / digest, perhaps as a card
            </li>
            <li>
              Customization / theming so groups&apos; Spaces and Studios can
              better reflect their identity
            </li>
            <li>
              Ways for people to discover and contribute to relevant clubs
            </li>
          </ul>
        </HelpDisclosure>
        <HelpDisclosure name="Hyperlink for Schools">
          <p>
            In the medium term, we want Hyperlink to be the best platform for
            independent internet-native schools to organize their activity.
          </p>
          <p>This might include:</p>
          <ul>
            <li>
              Composable structure with Spaces and Studios reflecting more
              complex hierarchies e.g. of cohorts, departments, and schools
            </li>
            <li>More advanced admin tools and settings</li>
            <li>
              Things like file uploads to have all learning materials in one
              place
            </li>
            <li>
              Calendars, scheduled cards, or other ways of working with things
              through time
            </li>
            <li>
              Other ways we can support novel models for schools — networked,
              personal, emergent, fractal…
            </li>
          </ul>
        </HelpDisclosure>
      </HelpDisclosureSection>

      <h2>Features</h2>
      <p>
        What we&apos;re working on! To view what we&apos;ve shipped, see our{" "}
        <Link href="/docs?tab=changelog" className="font-bold text-accent-blue">
          Changelog
        </Link>
        .
      </p>
      <p>
        If you have thoughts on what we should prioritize,{" "}
        <a
          className="font-bold text-accent-blue"
          href="mailto:contact@hyperlink.academy"
        >
          please reach out
        </a>
        !
      </p>
      <div className="flex flex-col gap-1">
        <h3>Active</h3>
        <p className="italic">currently in progress</p>
      </div>
      <HelpDisclosureSection>
        <HelpDisclosure name="Global nav & notifications">
          <p>
            Refactoring navigation throughout the app to use a consistent
            sidebar.
          </p>
          <p>
            This is a big one, touching all parts of the app, but will make
            everything feel more stable <em>and</em>
            allow us to add a global notification center!
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Card multiselect and actions">
          <p>A way to select many cards at once, and do things with them.</p>
          <p>
            Card actions may include changing color or reactions, dragging in
            canvas, or moving cards to other rooms.
          </p>
        </HelpDisclosure>
      </HelpDisclosureSection>
      <div className="flex flex-col gap-1">
        <h3>Planned</h3>
        <p className="italic">happening soon, with high likelihood</p>
      </div>
      <HelpDisclosureSection>
        <HelpDisclosure name="Block-based card editor">
          <p>
            New card editor, allowing for more flexible, modular card editing.
          </p>
          <p>
            This will enable interspersing text with images, linked cards, and
            (eventually) other media.
          </p>
        </HelpDisclosure>

        <HelpDisclosure name="Multi-column side scrolling card viewer">
          <p>
            Rather than just one room and one card open next to it, you should
            be able to click a card and have it open in a new column, with
            arbitrary nesting.
          </p>
          <p>
            This will make it easier to quickly browse collections, navigate
            nested rooms and cards, and compare things side by side.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Private Spaces & Studios">
          <p>
            A setting for both Spaces and Studios to make them viewable only to
            members.
          </p>
          <p>
            Many people prefer to do more intimate work behind closed doors; we
            want to support that.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Resizable canvas">
          <p>
            The &quot;canvas&quot; room has a mobile-sized fixed width, which is
            limiting!
          </p>
          <p>
            We want a way to make it bigger so you can visually organize cards
            in more flexible ways.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Room refactor">
          <p>
            There are some changes we want to make to the relationship between
            rooms, cards, and the sidebar.
          </p>
          <p>
            Things like: adding cards directly to the sidebar, allowing rooms to
            be linked in cards and other rooms, and making collection and canvas
            a view toggle rather than a separate room type.
          </p>
        </HelpDisclosure>
      </HelpDisclosureSection>
    </div>
  );
};

const HelpChangelog = () => {
  return (
    <div className="flex flex-col gap-4">
      <p>
        Here's what's new…and how the Hyperlink app has evolved since way back!
      </p>
      <p>
        To view what we&apos;re working on now (and soon), see our{" "}
        <Link href="/docs?tab=roadmap" className="font-bold text-accent-blue">
          Roadmap
        </Link>
        .
      </p>

      <HelpDisclosureSection>
        {/* LAST UPDATED: 3.25.24 */}

        {/* copy this section at the top to add a new items! */}
        {/* optional params: TK */}
        {/* 
        <HelpDisclosure name="" date="">
          <p></p>
        </HelpDisclosure>
        */}

        <HelpDisclosure name="Important TEST" date="1989-03-31" important>
          <p>Testing the important tag!</p>
        </HelpDisclosure>

        <HelpDisclosure name="Deprecated TEST" date="1989-03-31" deprecated>
          <p>Testing the deprecated tag!</p>
        </HelpDisclosure>

        <HelpDisclosure name="Meta TEST" date="1989-03-31" meta>
          <p>Testing the meta tag!</p>
        </HelpDisclosure>

        <HelpDisclosure name="Landing page refresh" date="2024-03-24">
          <p>
            We updated our landing page to be cleaner, snazzier, and emphasize
            our current focus on interent clubs.
          </p>
          <p>It also includes…</p>
          <ul>
            <li>
              New header with links to our writing (blog) and docs (help center)
              and log in / signup buttons
            </li>
            <li>
              More clear illustrations of how Studios, Spaces, rooms, and cards
              fit together, plus a list of other features
            </li>
            <li>
              Last but not least, a sweet new isometric{" "}
              <em>hyperlink academy</em> hero image!
            </li>
          </ul>
        </HelpDisclosure>
        <HelpDisclosure name="Deeplinking to cards" date="2024-03-06">
          <p>
            Copy a link to any card — useful for sharing direct links to cards
            with friends or collaborators.
          </p>
          <p>
            We're using this now in weekly club email digests, linking to recent
            activity. We think it'll be useful for sharing in Discord, group
            chats, newsletters, and more.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Studiomates can add reactions" date="2024-02-28">
          <p>
            Extending Studiomate permissions, where previously Studiomates could
            comment / chat in other Spaces in their Studios…
          </p>
          <p>
            Members of a Studio now can calso add reactions to Studiomates'
            Spaces, and see who reacted on hover — nice for adding a quick ❤️ or
            🙌!
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Studio join flow and settings improvements"
          date="2024-02-23"
        >
          <p>
            People invited to a Studio can now browse the Studio and join from a
            banner at the top of the page.
          </p>
          <p>
            We also added a couple settings for Studio creators: add an optional
            "getting started" section, and allow members to join any Space in
            the Studio.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Card background color" date="2024-02-05">
          <p>
            You can now pick from a handful of background colors in the card
            options menu, a la colorful pastel sticky notes.
          </p>
          <p>
            Useful for organizing or highlighting cards — or whatever temporary
            bespoke taxonomical flights of fancy strike you on a given day!
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Studio presence" date="2024-01-20">
          <p>
            From a Studio homepage, see presence tags on Space preview images
            when others are in Spaces in the Studio.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Multiple images on cards" date="2024-01-20">
          <p>
            Requested by many! Our previous constraint of one image per card is
            no more.
          </p>
          <p>
            Image sections on cards now support multiple images — you can upload
            (or copy-paste in) as many images as you like onto a card, and view
            them in a gallery.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Pretty link previews" date="2024-01-20">
          <p>
            When you paste in a URL to a card's title or content area, we now
            (when available) render a nice preview of the link, including title
            and thumbnail.
          </p>
          <p>
            This makes it nicer to view collections of lots of links – less{" "}
            <em>https://www.blahblahblah/lengthypath?randomstuff=here</em> and
            more <em>actual page title and preview image</em>.
          </p>
          <p>
            We aim to improve this further with a fully block-based card editor.
          </p>
        </HelpDisclosure>
      </HelpDisclosureSection>
    </div>
  );
};

// also used in homepage empty state
export const HelpExampleSpaces = () => {
  return (
    <div className="flex flex-col gap-3">
      <p className="">Here are a few of our Spaces for inspiration ✨🌱</p>

      <div className="my-4 flex flex-col gap-2">
        <a
          className="flex w-full flex-col gap-0 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:gap-0 sm:p-3"
          href="https://hyperlink.academy/s/brendan/s/Website%20Jam:%20pattern.kitchen/website-jam-patternkitchen"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3>side project</h3>
          <p className="text-sm italic">
            example: website on pattern languages 🌐
          </p>
        </a>
        <a
          className="flex w-full flex-col gap-0 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:gap-0 sm:p-3"
          href="https://hyperlink.academy/s/celine/s/Stuffy%20Stuff/stuffy-stuff"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3>creative project with a friend</h3>
          <p className="text-sm italic">example: stuffed animal crafting 🐰</p>
        </a>
        <a
          className="flex w-full flex-col gap-0 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:gap-0 sm:p-3"
          href="https://hyperlink.academy/s/brendan/s/23/hyperlink-writing-room-2023"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3>small group collab</h3>
          <p className="text-sm italic">
            example: Hyperlink team writing room ✍️
          </p>
        </a>
      </div>
    </div>
  );
};

// also used in /setup
export const HelpAppInfo = () => {
  return (
    <div className="flex flex-col gap-4">
      <p>
        Get Hyperlink on your home screen — and push notifications for new
        activity.
      </p>
      <h4>First, grab your phone 📱</h4>
      <ol>
        <li>Open hyperlink.academy in your browser</li>
        <li>
          Tap the Share icon (iOS / Safari) or three dot menu (Android / Chrome)
        </li>
        <li>Select &quot;Add to Home Screen&quot;</li>
      </ol>
      <h4>Then, turn on notifications 🔔</h4>
      <p>Open the app, log in, and from your homepage: </p>
      <p className="flex gap-2">
        <span className="inline-block justify-center">
          <Settings />
        </span>{" "}
        → <span className="self-center italic">enable notifications</span>
      </p>
      <p>We&apos;ll ping you for new chats & card comments.</p>
    </div>
  );
};

// HELP HELPERS [LOL]

const TextString = (props: { children: React.ReactNode }) => {
  return (
    <code className="rounded-md border border-grey-80 bg-grey-90 p-1 text-xs">
      {props.children}
    </code>
  );
};

const KeyboardKey = (props: { children: React.ReactNode }) => {
  return (
    <code className="rounded-md border border-grey-80 bg-background p-1 text-xs text-grey-55">
      {props.children}
    </code>
  );
};

const UnicodeKeyboardKey = (props: { children: React.ReactNode }) => {
  return (
    <span>
      <code className="rounded-md border border-grey-80 bg-background p-1 font-sans text-xs text-grey-55">
        {props.children}
      </code>
    </span>
  );
};

const HelpDisclosureSection = (props: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full flex-col items-start gap-2 rounded-md ">
      {props.children}
    </div>
  );
};

const HelpDisclosure = (props: {
  children: React.ReactNode;
  name: string;
  date?: string;
  important?: boolean;
  deprecated?: boolean;
  meta?: boolean;
}) => {
  return (
    <Disclosure as="div" className="flex w-full flex-col gap-0">
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`flex w-full items-center justify-between gap-2 border-grey-80 bg-bg-gold px-4 py-2 text-left hover:bg-grey-90 focus:outline-none focus-visible:ring focus-visible:ring-accent-blue ${
              open
                ? "rounded-t-md border-l border-r border-t"
                : "rounded-md border"
            }`}
          >
            <div className="flex w-full flex-col justify-between gap-1">
              {(props?.date ||
                props.important ||
                props.deprecated ||
                props.meta) && (
                <div className="flex w-fit items-center gap-2">
                  {props?.date && (
                    <span className="w-fit text-xs italic text-grey-55">
                      {props.date}
                    </span>
                  )}
                  {props.important && (
                    <span className="lightBorder bg-accent-gold px-2 py-0.5 text-xs">
                      important
                    </span>
                  )}
                  {props.deprecated && (
                    <span className="lightBorder bg-grey-80 px-2 py-0.5 text-xs">
                      deprecated
                    </span>
                  )}
                  {props.meta && (
                    <span className="lightBorder bg-bg-blue px-2 py-0.5 text-xs">
                      meta
                    </span>
                  )}
                </div>
              )}
              <span className="font-bold">{props.name}</span>
            </div>
            {!open ? <DisclosureExpandTiny /> : <DisclosureCollapseTiny />}
          </Disclosure.Button>
          <Disclosure.Panel
            className={`border-grey-80 bg-white px-4 py-2 pb-4 pt-4 ${
              open
                ? "rounded-b-md border-b border-l border-r"
                : "rounded-md border"
            }`}
          >
            <div className="flex flex-col gap-4">{props.children}</div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
