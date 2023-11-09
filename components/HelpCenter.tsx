import { Tab } from "@headlessui/react";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import { Settings } from "./Icons";
import { ModalFixedHeight } from "./Layout";
import { DividerSmall, DividerTiny } from "pages";

export const HelpModal = (props: { open: boolean; onClose: () => void }) => {
  return (
    <ModalFixedHeight open={props.open} onClose={props.onClose}>
      <HelpDocs />
    </ModalFixedHeight>
  );
};

export const HelpDocs = () => {
  let router = useRouter();
  let [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(() => {
      return router.query.tab
        ? ["handbook", "shortcuts", "examples", "app"].indexOf(
            router.query.tab as string
          )
        : 0;
    });
  }, [router.query.tab]);

  return (
    <>
      <h3 className="m-auto">Hyperlink Help Docs</h3>
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
          {/* <Tab as={Fragment}>
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
          </Tab> */}
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
          {/* <Tab.Panel>
            <HelpChangelog />
          </Tab.Panel> */}
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
      <h2>Handbook</h2>
      <p>
        Welcome! Hyperlink is a place to do meaningful things — creative
        projects; book clubs; learning groups — together on the internet.
      </p>
      {/* <p>
        Here&apos;s a <em>very short handbook</em>:
      </p> */}
      <DividerTiny />
      <p>
        Activity on Hyperlink happens in <strong>Spaces</strong> — small worlds
        for shared work.
      </p>
      <p>In a Space, you can:</p>
      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li className="marker:text-accent-blue">
          Make <strong>cards</strong> for meaningful things, like ideas, tasks,
          and questions
        </li>
        <li className="marker:text-accent-red">
          Organize & work with cards in <strong>rooms</strong>
        </li>
        <li className="marker:text-accent-gold">
          Talk together with <strong>chats</strong> & <strong>comments</strong>
        </li>
        {/* <li className="marker:text-accent-blue">
          <strong>Invite others</strong> to join & explore with you
        </li> */}
      </ul>
      <DividerTiny />
      <p>
        The magic multiplies when you invite others to join & explore with you:
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li className="marker:text-accent-blue">
          <strong>notifications</strong>, for pings on Space activity
        </li>
        <li className="marker:text-accent-red">
          <strong>unreads</strong>, to see what&apos;s new in one place
        </li>
        <li className="marker:text-accent-gold">
          <strong>live presence</strong>, to see where others are in the Space
        </li>
        <li className="marker:text-accent-blue">
          <strong>audio calls</strong>, to hang & explore together
        </li>
      </ul>
      <p>
        To get started, <strong>make a Space</strong> and{" "}
        <strong>invite a friend</strong> to jam, riff, play…
      </p>
      <p>
        And repeat! Over time your Spaces on Hyperlink form an ecosystem:
        seedlings, active projects, archives, communities of collaborators.
      </p>
      <p>
        Questions? Suggestions?{" "}
        <a href="mailto:contact@hyperlink.academy" className="text-accent-blue">
          Email us
        </a>{" "}
        any time :)
      </p>
      <p>—The Hyperlink Team</p>
      {/* <p>
        When you open the app, you&apos;ll land in your{" "}
        <strong>homeroom</strong> — your home base for all Spaces you create or
        join.
      </p> */}
      {/* <p>
        You can also make <strong>Studios</strong> — where a group can collect
        Spaces to share work across many projects.
      </p> */}
      {/* <p>To get started:</p> */}
      {/* <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li className="marker:text-accent-blue">Make a Space</li>
        <li className="marker:text-accent-red">Invite a friend</li>
        <li className="marker:text-accent-gold">Add ideas, riff, play…</li>
      </ul> */}
      {/* <p>
        And repeat! Over time your Spaces on Hyperlink form an ecosystem: seeds
        of ideas, active projects, archives of past work, communities of
        collaborators.
      </p> */}
      {/* <p>
        Questions?{" "}
        <a href="mailto:contact@hyperlink.academy" className="text-accent-blue">
          Email us
        </a>{" "}
        any time. Always evolving, ears open for suggestions :)
      </p> */}
      {/* <p>—The Hyperlink Team</p> */}
    </div>
  );
};

const HelpShortcuts = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2>Shortcuts</h2>

      <p>
        An evolving list of shortcuts you may find helpful in using Hyperlink!
      </p>

      <h3>text editing</h3>
      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li>
          start a line with <TextString>#</TextString> or{" "}
          <TextString>##</TextString> for headers
        </li>
        <li>
          <TextString>[[</TextString> and search to inline link to a card
        </li>
        <li>
          wrap in <TextString>*</TextString> or{" "}
          <KeyboardKey>ctrl/cmd</KeyboardKey> + <KeyboardKey>i</KeyboardKey> for
          italic
        </li>
        <li>
          wrap in <TextString>**</TextString> or{" "}
          <KeyboardKey>ctrl/cmd</KeyboardKey> + <KeyboardKey>b</KeyboardKey> for
          bold
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

      <h3>chat & comments</h3>
      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li>
          <KeyboardKey>enter</KeyboardKey> to send a message
        </li>
        <li>
          <KeyboardKey>shift</KeyboardKey> + <KeyboardKey>enter</KeyboardKey>{" "}
          for a line break
        </li>
      </ul>

      <h3>rooms & cards</h3>
      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li>
          <i>canvas</i>: <KeyboardKey>ctrl/cmd</KeyboardKey> + click for new
          card
        </li>
        <li>
          <i>collection</i>: drag to reorder cards
        </li>
        <li>
          <KeyboardKey>alt</KeyboardKey> + <KeyboardKey>↑</KeyboardKey> and{" "}
          <KeyboardKey>↓</KeyboardKey> to switch rooms
        </li>
        <li>drag to reorder rooms in sidebar</li>
        <li>drag a card onto another to link them</li>
      </ul>

      <h3>general</h3>
      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li>
          <KeyboardKey>ctrl/cmd</KeyboardKey> + <KeyboardKey>z</KeyboardKey> to
          undo
        </li>
        <li>
          <KeyboardKey>ctrl/cmd</KeyboardKey> + <KeyboardKey>shift</KeyboardKey>{" "}
          + <KeyboardKey>z</KeyboardKey> = redo
        </li>
      </ul>
    </div>
  );
};

const HelpChangelog = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2>Changelog</h2>
      <p>TBD, changelog coming soon!</p>
    </div>
  );
};

// also used in homepage empty state
export const HelpExampleSpaces = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2>Example Spaces</h2>
      <p className="">Here are a few of our Spaces for inspiration ✨🌱</p>

      <div className="my-4 flex flex-col gap-4">
        <a
          className="flex w-full flex-col gap-2 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:gap-4 sm:p-4"
          href="https://hyperlink.academy/s/brendan/s/Website%20Jam:%20pattern.kitchen/website-jam-patternkitchen"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>side project</h2>
          <p className="text-sm italic">
            example: website on pattern languages 🌐
          </p>
        </a>
        <a
          className="flex w-full flex-col gap-2 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:gap-4 sm:p-4"
          href="https://hyperlink.academy/s/celine/s/Stuffy%20Stuff/stuffy-stuff"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>creative project with a friend</h2>
          <p className="text-sm italic">example: stuffed animal crafting 🐰</p>
        </a>
        <a
          className="flex w-full flex-col gap-2 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:gap-4 sm:p-4"
          href="https://hyperlink.academy/s/brendan/s/23/hyperlink-writing-room-2023"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>small group collab</h2>
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
      <h2>Add the App!</h2>
      <p>
        Get Hyperlink on your home screen — and get push notifications for
        activity in your Spaces.
      </p>
      <h3>first, grab your phone 📱</h3>
      <ol className="flex list-decimal flex-col gap-1 pl-8">
        <li>Open hyperlink.academy in your browser</li>
        <li>
          Tap the Share icon (iOS / Safari) or three dot menu (Android / Chrome)
        </li>
        <li>Select &quot;Add to Home Screen&quot;</li>
      </ol>
      <h3>then, turn on notifications 🔔</h3>
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
    <code className="rounded-md border border-grey-55 bg-grey-90 px-[2px] py-[2px] text-xs">
      {props.children}
    </code>
  );
};

const KeyboardKey = (props: { children: React.ReactNode }) => {
  return (
    <code className="rounded-md bg-grey-35 px-[4px] py-[2px] text-xs text-white shadow shadow-accent-gold">
      {props.children}
    </code>
  );
};
