import { Menu } from "@headlessui/react";
import { ButtonPrimary } from "components/Buttons";
import { MoreOptions } from "components/Icons";
import { Modal, MenuContainer, MenuItem, Divider } from "components/Layout";
import { useState } from "react";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const LayoutStory = (props: Props) => {
  let [isOpen, setModal] = useState(false);

  return (
    <ComponentViewer components={props.components} stories={{}}>
      <h3>Modal</h3>
      <ButtonPrimary content="Click me!" onClick={() => setModal(true)} />
      <Modal open={isOpen} onClose={() => setModal(false)}>
        <div>Hello I am a Modal!</div>
      </Modal>

      <h3>Dropdown (right align)</h3>
      <div className="text-right">
        <Menu>
          {/* Make sure Menu.Button is center with other things on th same row by adjusting mt!! */}
          <Menu.Button className="relative mt-[2px]">
            <MoreOptions />
          </Menu.Button>

          {/* Make sure MenuContainer aligns with the ednge of the MenuButton by adjusting the right value!! */}
          <MenuContainer className="right-3 justify-items-end">
            <MenuItem>
              <p className="flex items-center gap-2">This is Item 1</p>
            </MenuItem>
            <MenuItem>
              <p className="flex items-center gap-2">And here is Item 2</p>
            </MenuItem>
          </MenuContainer>
        </Menu>
      </div>

      <h3>Dropdown (left align)</h3>
      <div>
        <Menu>
          {/* Make sure Menu.Button is center with other things on th same row by adjusting mt!! */}
          <Menu.Button className="relative mt-[2px]">
            <MoreOptions />
          </Menu.Button>

          {/* Make sure MenuContainer aligns with the ednge of the MenuButton by adjusting the left value!! */}
          <MenuContainer className="left-3">
            <MenuItem>
              <p className="flex items-center gap-2">This is Item 1</p>
            </MenuItem>
            <MenuItem>
              <p className="flex items-center gap-2">And here is Item 2</p>
            </MenuItem>
          </MenuContainer>
        </Menu>
      </div>

      <h3>Divider</h3>
      <Divider />
    </ComponentViewer>
  );
};

LayoutStory.metadata = {
  name: "Layout",
};

export default LayoutStory;
