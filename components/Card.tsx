import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";

import { ButtonLink } from "./Buttons";
import { FindOrCreateCard } from "./FindOrCreateCard";
import {
  MoreOptions,
  Add,
  Delete,
  DeckSmall,
  Settings,
  SectionLinkedCard,
  SectionText,
} from "./Icons";
import { Divider, FloatingContainer } from "./Layout";
import { SmallCard } from "./SmallCard";

export const Card = () => {
  return (
    <div
      className={`
    px-5 py-6
    border border-grey-80 rounded-lg 
    shadow-drop
    bg-white
    `}
    >
      <div className="grid grid-auto-row gap-6">
        <div className="grid grid-auto-rows gap-3">
          <div className="cardHeader grid grid-cols-[auto_min-content] gap-2 items-start">
            <h2 className="">Card Name</h2>
            <div className="mt-[4px]">
              <MoreOptionsMenu />
            </div>{" "}
          </div>

          <div className="cardDefaultContent grid grid-auto-rows gap-2">
            <p>
              This is some default content that I am typing here to make it look
              like something is being said.
            </p>
          </div>
        </div>

        <div className="textSection grid grid-auto-rows gap-2">
          <div className="grid grid-cols-[auto_min-content_min-content] gap-2 items-start">
            <h4 className="mt-[1px]">Text Section Title Here</h4>
            <div className="text-grey-55">
              <SectionText />
            </div>
            <button className="mt-1">
              <MoreOptions />
            </button>
          </div>
          <p>
            Hello, I am here again with more text and I just keep on coming with
            those bangers. Is there an award I can get for best copy text? The
            Blabies?
          </p>
        </div>

        <div className="linkedCardSection textSection grid grid-auto-rows gap-2">
          <div className="grid grid-cols-[auto_min-content_min-content] gap-2 items-start">
            <h4 className="mt-[1px]">Linked Card Section Title Here</h4>
            <div className="text-grey-55">
              <SectionLinkedCard />
            </div>
            <button className="mt-1">
              <MoreOptions />
            </button>
          </div>
          <FindOrCreateWithContext />
          <div className="grid grid-cols-2 gap-4">
            <SmallCard
              href=""
              entityID={"0"}
              id={"1"}
              draggable={true}
              onDelete={() => {}}
            />
            <SmallCard
              href=""
              entityID={"0"}
              id={"2"}
              draggable={true}
              onDelete={() => {}}
            />
            <SmallCard
              href=""
              entityID={"0"}
              id={"3"}
              draggable={true}
              onDelete={() => {}}
            />
            <SmallCard
              href=""
              entityID={"0"}
              id={"4"}
              draggable={true}
              onDelete={() => {}}
            />
            <SmallCard
              href=""
              entityID={"0"}
              id={"5"}
              draggable={true}
              onDelete={() => {}}
            />
          </div>
        </div>

        <div className="addSectionButton grid grid-auto-row gap-2 pb-6">
          <Divider />
          <button className="flex gap-2 text-grey-80">
            <Add />
            <h4 className="text-grey-80 ">Add Section</h4>
          </button>
        </div>
      </div>
    </div>
  );
};

const FindOrCreateWithContext = () => {
  let [open, setOpen] = useState(false);
  let [selectedCards, setSelectedCards] = useState<string[]>([]);
  return (
    <>
      <input
        type="text"
        placeholder="search to add cards..."
        onClick={() => setOpen(true)}
      ></input>
      <FindOrCreateCard
        open={open}
        onClose={() => setOpen(false)}
        selected={selectedCards}
        onSelect={() => {
          //TODO
        }}
      />
      <ul>
        {selectedCards.map((c) => {
          return (
            <li>
              {c}{" "}
              <ButtonLink
                content="delete"
                onClick={() =>
                  setSelectedCards((cards) => cards.filter((c1) => c1 !== c))
                }
              />
            </li>
          );
        })}
      </ul>
    </>
  );
};

const MoreOptionsMenu = () => {
  return (
    <div className="text-right">
      <Menu>
        <Menu.Button className="mt-[2px] relative">
          <MoreOptions />
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="px-3 py-4 border border-grey-80 rounded-md shadow-drop bg-white absolute right-8 justify-items-end grid grid-auto-row gap-3">
            <Menu.Item>
              <button className="flex items-center gap-2">
                <p>Remove from Deck</p>
                <DeckSmall />
              </button>
            </Menu.Item>
            <Divider />
            <Menu.Item>
              <button className="flex items-center gap-2 text-accent-red">
                <p>Delete Card Everywhere</p>
                <Delete />
              </button>
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};
