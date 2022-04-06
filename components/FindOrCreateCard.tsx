import { Combobox, Dialog } from "@headlessui/react";
import { useState } from "react";

type Item = {
  name: string;
  icon: React.ReactElement;
};
export const FindOrCreateCard = (props: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: { value: string }) => void;
  selectedCard: string;
  items: Item[];
}) => {
  let [input, setInput] = useState("");
  let items = props.items.filter((f) => {
    if (/[A-Z]/g.test(input)) return f.name.includes(input);
    return f.name.toLocaleLowerCase().includes(input.toLocaleLowerCase());
  });
  let inputExists = !!items.find(
    (i) => i.name.toLocaleLowerCase() === input.toLocaleLowerCase()
  );
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      className="fixed z-10 inset-0 overflow-y-hidden"
    >
      <Dialog.Overlay className="fixed inset-0 bg-grey-90 opacity-30" />
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-[80vw] min-w-[384px] mx-auto">
          <Combobox
            value={props.selectedCard}
            onChange={(c) => {
              setInput(c);
              props.onSelect({ value: c });
            }}
            as="div"
            className="relative z-10 w-full"
          >
            <Combobox.Input
              value={input}
              className="w-full p-2 rounded-md border-grey-55 border"
              placeholder="search or create"
              onChange={(e) => setInput(e.currentTarget.value)}
            />
            <Combobox.Options
              static
              className="w-full py-4 flex-col flex gap-2 bg-white mt-2 mb-8 rounded-md h-[80vh] overflow-y-auto shadow-drop"
            >
              {inputExists ? null : (
                <Combobox.Option key={"create"} value={input}>
                  {({ active }) => {
                    return (
                      <SearchItem active={active}>
                        <div className="px-2 p-1.5 border-2 border-b-accent-blue rounded-md text-accent-blue font-bold w-full bg-white">
                          {!input ? "Create a blank card" : `Create "${input}"`}
                        </div>
                      </SearchItem>
                    );
                  }}
                </Combobox.Option>
              )}
              {items.map((item) => {
                return (
                  <Combobox.Option key={item.name} value={item.name}>
                    {(props) => {
                      return (
                        <SearchItem active={props.active}>
                          <div className="flex flex-row gap-2 items-center">
                            {item.icon}
                            {item.name}
                          </div>
                        </SearchItem>
                      );
                    }}
                  </Combobox.Option>
                );
              })}
            </Combobox.Options>
          </Combobox>
        </div>
      </div>
    </Dialog>
  );
};

const SearchItem: React.FC<{
  active: boolean;
  className?: string;
}> = (props) => {
  return (
    <div
      className={`w-full px-3 py-0.5 ${props.className || ""} ${
        props.active ? "bg-bg-blue" : ""
      }`}
    >
      {props.children}
    </div>
  );
};
