import { useState } from "react";
import { ButtonLink } from "./Buttons";

import { FindOrCreateCard } from "./FindOrCreateCard";
import {
  MoreOptions,
  Add,
  Settings,
  SectionLinkedCard,
  SectionText,
} from "./Icons";
import { Divider } from "./Layout";
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
            <h2 className="mt-[2px]">Card Name</h2>
            <button className="">
              <Settings />
            </button>
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
