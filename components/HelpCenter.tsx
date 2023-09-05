import { Tab } from "@headlessui/react";
import { Children, Fragment } from "react";
import { Modal, ModalFixedHeight } from "./Layout";

export const HelpModal = (props: { open: boolean; onClose: () => void }) => {
  return (
    <ModalFixedHeight open={props.open} onClose={props.onClose}>
      <HelpDocs />
    </ModalFixedHeight>
  );
};

export const HelpDocs = () => {
  return (
    <>
      <h3 className="m-auto">Hyperlink Help Center 🌱</h3>
      <Tab.Group manual>
        <Tab.List className="m-auto flex gap-1">
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
                Changelog
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
            <HelpChangelog />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

const HelpHandbook = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2>Handbook</h2>

      <p>
        Welcome! Hyperlink is a place to do meaningful things — creative
        projects; book clubs; learning groups — together on the internet.
      </p>

      <p>
        Here&apos;s a <em>very short handbook</em>:
      </p>

      <p>
        Activity on Hyperlink happens in <strong>Spaces</strong> — small worlds
        for shared projects.
      </p>

      <p>In a Space, you can:</p>

      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li className="marker:text-accent-blue">
          Create <strong>cards</strong> for meaningful things: ideas, tasks,
          questions, inspo…
        </li>
        <li className="marker:text-accent-red">
          Organize & work with cards in <strong>rooms</strong>
        </li>
        <li className="marker:text-accent-gold">
          Talk together in <strong>chats</strong> & <strong>comments</strong>
        </li>
        <li className="marker:text-accent-blue">
          <strong>Invite others</strong> to join & explore with you
        </li>
      </ul>

      <p>
        When you open the app, you&apos;ll land in your{" "}
        <strong>homeroom</strong> — your home base for all Spaces you create or
        join.
      </p>

      <p>
        You can also make <strong>Studios</strong> — where a group can collect
        Spaces to share work across many projects.
      </p>

      <p>To get started:</p>

      <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
        <li className="marker:text-accent-blue">Make a Space</li>
        <li className="marker:text-accent-red">Invite a friend</li>
        <li className="marker:text-accent-gold">Add ideas, riff, play…</li>
      </ul>

      <p>
        And repeat! Over time your Spaces on Hyperlink form an ecosystem: seeds
        of ideas, active projects, archives of past work, communities of
        collaborators.
      </p>

      <p>
        Questions?{" "}
        <a href="mailto:contact@hyperlink.academy" className="text-accent-blue">
          Email us
        </a>{" "}
        any time. Always evolving, ears open for suggestions :)
      </p>

      <p>—The Hyperlink Team</p>
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
          <TextString>[[</TextString> and search to inline link to a card
        </li>
        <li>
          start a line with <TextString>#</TextString> or{" "}
          <TextString>##</TextString> for headers
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
          canvas: <KeyboardKey>ctrl/cmd</KeyboardKey> + click for new card
        </li>
        <li>collection: drag to reorder cards</li>
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
        <li>
          <KeyboardKey>alt</KeyboardKey> + <KeyboardKey>↑</KeyboardKey> and{" "}
          <KeyboardKey>↓</KeyboardKey> to switch rooms
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
