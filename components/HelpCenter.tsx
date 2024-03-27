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
        {/* optional (boolean) props: important, deprecated, meta */}
        {/* 
        <HelpDisclosure name="" date="">
          <p></p>
        </HelpDisclosure>
        */}

        {/* 2024 changes */}

        <HelpDisclosure
          name="Refresh homepage to focus on clubs"
          date="2024-03-24"
          meta
        >
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
        <HelpDisclosure name="Improved chat styling" date="2024-01-18">
          <p>
            We did a pass to improve chat styling, making it a bit more fun, and
            (more importantly) making it more clear who is who!
          </p>
          <p>
            Making conversations more colorful — both chat rooms and comments on
            cards reflect your per-Space member color and more clearly
            distinguish between others' messages and yours.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Rotating images" date="2024-01-13">
          <p>
            You can now rotate images after uploading them! A small but welcome
            change, particularly when uploading photos directly from mobile.
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Studiomate commenting"
          date="2024-01-09"
          important
        >
          <p>
            Studiomates — that is, other members of a Studio you're in — can now
            comment in other Spaces in a Studio. This works both for chat rooms
            and card comments.
          </p>
          <p>
            We find this useful for sharing feedback on others' projects, where
            it's nice to keep the set of actual creators / participants distinct
            as the members of a given Space, but let anyone else in the Studio
            share thoughts, encouragement, etc.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Studio custom welcome message" date="2024-01-02">
          <p>
            Studio creators can now customize a welcome message that shows on
            the invite page.
          </p>
          <p>
            This way, when you send people the invite link, they can see a bit
            more context right away on what the Studio's about and what it means
            to join.
          </p>
        </HelpDisclosure>

        {/* 2023 changes */}

        <HelpDisclosure name="New Studio page" date="2023-12-19" important>
          <p>
            A complete revamp of Studios, which we initially launched several
            months back!
          </p>
          <p>
            We simplified Studios to focus on the people (Members list) and
            activity (Spaces list) in the Studio, and added an "About" page to
            add more info both for current members and public visitors
            interested in learning more.
          </p>
          <p>
            We removed the previous "Posts" functionality, which was a bit
            convoluted, but we're thinking about ways to add back in ways to
            chat and announce things on a Studio level.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Global search" date="2023-11-30" important>
          <p>
            We replaced the old search room with a new global search bar,
            accessible from everywhere in a Space.
          </p>
          <p>
            A couple nice things this does better: you can now search for cards
            and drag them directly from search results into a room or another
            card, and you can navigate with keyboard shortcuts to search and
            place cards!
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Improved onboarding" date="2023-11-21">
          <p>
            Improved the overall Hyperlink new user onboarding flow, with
            restyle modals, custom illustrations, simpler flows, and a nicer
            empty state for your homepage.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Autocomplete card titles" date="2023-10-30">
          <p>
            When you create a blank card, entering a title now also searches
            existing card titles, so you can add an existing card this way.
          </p>
          <p>
            For example in a canvas: double click to add card, search title,
            arrows to select and enter (instead of previously: open
            find-or-create, then either add blank card *or* search for existing
            cards).
          </p>
          {/* NB: kinda think we could unship this…or at least bring back find-or-create in canvas! */}
        </HelpDisclosure>
        <HelpDisclosure name="Retool dashboard" date="2023-10-26" meta>
          <p>
            We set up a basic dashboard so that we can get more insight into
            who's using the app and what they're doing.
          </p>
          <p>
            This includes new users, recently created Spaces, and other
            activity…fun to more easily explore new things people are trying on
            Hyperlink!
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Image pasting" date="2023-10-23">
          <p>
            Making it easier to add images — we now handle pasting images
            directly into canvases and collections as well as directly in cards.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Room presence" date="2023-09-12">
          <p>
            Extending presence in Spaces to now show what rooms people are in,
            as well as what cards. You'll now see small colored dots in the
            sidebar room list, in rooms where people are active, and then when
            you navigate to that room you can find exactly what card each person
            is on.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="New backlinks and back button" date="2023-09-07">
          <p>
            Moved the backlinks section to a tabbed section alongside card
            comments in a pop-up drawer, sticky at the bottom of the card.
          </p>
          <p>
            Cards now look a bit cleaner by default, and have both comments and
            backlinks just one tap away.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="README card in new Spaces" date="2023-09-06">
          <p>
            A default "README" card in new Spaces, with some quick instructions
            on how to use the app and things to try to get started.
          </p>
          {/* NB: this might be something we should remove eventually */}
        </HelpDisclosure>
        <HelpDisclosure name="Unreads room" date="2023-09-04" important>
          <p>
            View all your unread cards and messages in one place — a special new
            "unreads" room in each Space!
          </p>
          <p>
            Anything you haven't yet seen will now not only glow, but show in
            this room until you read it; it will then disappear the next time
            you re-open the unreads room.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Default rooms in Spaces" date="2023-09-01">
          <p>
            New Spaces now have one of each room by default — Canvas,
            Collection, and Chat — to make the different room types more
            discoverable.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Presence on cards" date="2023-08-29" important>
          <p>
            Along with seeing who's in a Space from the members list in the
            sidebar, you can now see what card each person is on, with little
            colorful name tags for each member.
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Audio calls in Spaces"
          date="2023-08-29"
          important
        >
          <p>You can now start and join audio calls directly within a Space!</p>
          <p>
            One per Space, from the sidebar — you can even see who's in a call,
            and what card each person is on.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="More Markdown support" date="2023-08-22">
          <p>
            For a while now we've supported a basic subset of Markdown syntax in
            cards — bold, italic, h1 and h2.
          </p>
          <p>
            Now, a few more: highlight, strikethrough, inline code, and
            blockquote.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Push notifications" date="2023-08-11" important>
          <p>
            A welcome new addition, particularly useful for the Hyperlink PWA:
            push notifications!
          </p>
          <p>
            You can now install the app and enable notifications directly on
            your mobile device (something only recently made possible on iOS).
            This goes a long way toward making Hyperlink feel more app-like on
            mobile, and much easier to keep tabs on activity in Spaces.
          </p>
          <p>To start, notifications are for new messages only.</p>
        </HelpDisclosure>
        <HelpDisclosure name="New tabbed help center" date="2023-07-31">
          <p>
            In-app docs, a help center that you can view from anywhere within a
            Space. To start, this includes a basic welcome message / handbook,
            and a list of handy keyboard shortcuts.
          </p>
          <p>This is also available on a standalone page (/docs)</p>
        </HelpDisclosure>
        <HelpDisclosure name="Improved join pages" date="2023-07-12">
          <p>
            Refactored the "join" pages prospective members see when invited, to
            be consistent for both Spaces and Studios.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Members list in Studios" date="2023-07-11">
          <p>
            Added a "members" tab on the Studio page, so you can see a list of
            everyone who's a part of the Studio.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Posts in Studios" date="2023-06-29" deprecated>
          <p>
            Trying out a way to make "posts" to a Studio, a sort of bulletin
            board for announcements, new Spaces, and more.
          </p>
          <p>
            As part of this, you can highlight cards from within a Space to
            share them one level up, directly to the studio, and others in the
            Studio can react and comment on them.
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Studios, a new homepage for groups"
          date="2023-06-16"
          important
        >
          <p>
            Starting on a new construct we're calling <em>Studios</em>! Not to
            be confused with earlier on when we called a user's homepage their
            studio (e.g. "brendan's studio") — now we just call that "home".
          </p>
          <p>
            Studios are a place for teams, cohorts, or other groups to work
            together over time across many Spaces.
          </p>
          <p>
            With this initial release you can create, delete, edit, and join
            Studios.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Inline card links" date="2023-04-30">
          <p>
            Link to other cards inline, wiki-style, from within the card content
            area. Use double bracket syntax — `[[like this]]` — to link to any
            other card in a Space, and search for existing cards to link.
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="New landing page for beta signups"
          date="2023-04-28"
          meta
          deprecated
        >
          <p>
            We updated the hyperlink.academy landing page, moving from
            invite-only closed alpha to a more open beta where anyone can sign
            up!
          </p>
          <p>
            The main changes: show more clearly what the app does and how it
            works, and a add a clear CTA to create an account.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Room descriptions" date="2023-04-20">
          <p>
            Added an option to specify a description at the top of a room, just
            beneath the room name.
          </p>
          <p>
            This is useful for adding some context, like the current purpose of
            a room, or instructions for how to use it.
          </p>
          <p>Contributors: Juan Jose Fernandez</p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Filtering collections by reaction"
          date="2023-04-17"
        >
          <p>
            Building on the reactions, or "reactags" feature, it is now possible
            to filter a collection by reaction.
          </p>
          <p>
            We find this useful for collections that serve as to do lists — you
            can tag things like "WIP" or your initials to claim them, or ✅ to
            mark things complete, and filter combinations (things with multiple
            tags), as well as both things with a given tag and things without a
            tag (exclusion).
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Chat rooms" date="2023-04-11" important>
          <p>
            A special new type of room! Just for chat! You can now have a room
            as chat channel right in the sidebar, for Space-wide chat and
            conversations…as many as you like, a la Slack or Discord (but
            cozier, of course).
          </p>
          <p>
            And a couple other chat improvements: we simplified from multiple
            discussions to one single-threaded chat per card, and made it
            possible to reply to particular messages and attach cards to
            messages in chat.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Migrate to Supabase" date="2023-03-29" meta>
          <p>
            New database, who dis? This doesn't change how we store the data
            inside a Space (i.e. rooms and cards), but is a big migration with
            how we store all other data across the app, for things like user
            authentication and Space membership.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Unreads on homepages" date="2023-03-09">
          <p>
            Bubble up unread notifications to people's homepages, by showing the
            Space "door" preview with a glowing outline, so you can see at a
            glance which of your Spaces have new activity.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Search room" date="2023-03-08" deprecated>
          <p>
            A basic search room, listing all cards in the Space, where you can
            search to filter.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Reactions on cards" date="2023-03-06" important>
          <p>
            A way to add custom reactions (or "reactags", as we dubbed them) to
            cards. Each can have up to four characters, perfect for emoji or
            e.g. simple initials or acronyms.
          </p>
          <p>
            These serve double duty, as both emoji reaction as you're used to in
            Slack, Discord, etc. *and* as a simple way to tag cards. Spaces have
            a default set of reactions, which you can customize.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Space progress bar" date="2023-02-22" deprecated>
          <p>
            Added a progress bar to Space headers, based on start and end dates
            (if specified) to show how much progress has elapsed.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Collection views" date="2023-02-22">
          <p>
            A way to toggle between multiple views of cards in a collection:
            small row (title-only), large row (card content), and grid (of
            thumnail-sized cards; this latter view has since been removed).
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Discussions on cards"
          date="2023-02-20"
          deprecated
        >
          <p>
            Added a "discussions" area on every card, where you can create
            multiple threads, or nested discussions, on the card.
          </p>
          <p>
            Also extended unread indicators to show not only new cards, but new
            discussions / messages on cards.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="New room types" date="2023-02-14" important>
          <p>
            We removed prompt rooms, and added "collection" as a distinct room
            type — a reorderable list of cards, to complement the existing more
            freeform spatial "canvas" room.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="PWA groundwork" date="2023-02-09">
          <p>
            Laying the foundations for making Hyperlink work nicely as a
            progressive web app, or PWA, or "that thing where you add a website
            to the home screen of your phone"!
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Internal app events" date="2023-02-07" meta>
          <p>
            Added some internal 'events' in the app to track when basic things
            happen, like when someone joins a Space, or creates a card.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Unread cards in rooms" date="2023-02-02">
          <p>
            Unread indicators for rooms (starting with member rooms), so you can
            see from the sidebar list where there are new cards.
          </p>
        </HelpDisclosure>
        <HelpDisclosure
          name="Multiselect and drag cards"
          date="2023-01-30"
          deprecated
        >
          <p>
            A way to long press cards to enter selection mode, and select many
            at once to move them around on the canvas.
          </p>
          <p>(Since deprecated…but working on bringing it back!)</p>
          <p>Contributors: Azlen Elza</p>
        </HelpDisclosure>
        <HelpDisclosure name="Calendar room" date="2023-01-26" important>
          <p>
            Add dates to cards, and view all "scheduled" cards in one place, in
            a simple calendar room.
          </p>
          <p>
            This is useful for future things — deadlines; due dates — as well as
            keeping track of things you do in a log, day by day.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Random prompts" date="2023-01-26" deprecated>
          <p>
            Testing an idea for prompts, with a special type of room and a
            button that allows you to draw cards.
          </p>
          <p>
            We tried two types, randomly drawing prompts from a collection, and
            daily prompts where you draw cards with today's date.
          </p>
          <p>
            The idea here: a mechanic for designating certain cards as important
            or as source material, and "drawing" them to use in particular ways
            — inspiration, assignments, and so on.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Multiple rooms" date="2023-01-24" important>
          <p>
            A big change in Space organization possibilities — you can now
            create multiple rooms! As many as you like!
          </p>
          <p>
            You can make many rooms and access them in the sidebar…useful to
            have different collections, rooms for each member to work in, rooms
            per phase of a project, etc.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Big code cleanup!" date="2023-01-20" meta>
          <p>
            Sometimes it's not about what you add, but what you take away. We
            decided to start the year by cleaning up (read: deleting) a bunch of
            code that was little-used and/or a pain to maintain.
          </p>
          <p>
            This included: our older implementation of per-Space chat,
            highlights, bots and GraphQL, and card sections.
          </p>
        </HelpDisclosure>
        <HelpDisclosure name="Undo support" date="2023-01-19">
          <p>
            Added support for undo, and implemented in various places in the
            app, like card creation and text editing. Making it easier to do
            things and change your mind in Hyperlink since…well, since 1.19.23!
          </p>
          <p>Contributors: Azlen Elza</p>
        </HelpDisclosure>

        {/* 
        <HelpDisclosure name="" date="">
          <p></p>
        </HelpDisclosure>
        */}
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
