import { Dialog, Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";

export const Divider = () => {
  return <div className="border-t border-grey-80 w-full"></div>;
};

export const FloatingContainer: React.FC<{ className?: string }> = (props) => {
  return (
    <div
      className={`
        px-3 py-4
        border border-grey-80 rounded-md 
        shadow-drop
        bg-white
        ${props.className}
        `}
    >
      {props.children}
    </div>
  );
};

export const Modal: React.FC<{ open: boolean; onClose: () => void }> = (
  props
) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      className="fixed z-10 inset-0 overflow-y-hidden"
    >
      <Dialog.Overlay className="overlay" />
      <FloatingContainer
        className={`
              fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              grid grid-flow-row gap-4
              max-w-md
              w-[calc(100%-56px)]
              `}
      >
        {props.children}
      </FloatingContainer>{" "}
    </Dialog>
  );
};

export const MenuContainer: React.FC<{ className?: string }> = (props) => {
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        className={`
            px-3 py-4 
            border border-grey-80 rounded-md 
            shadow-drop bg-white 
            absolute justify-items-end 
            flex flex-col gap-3 
            text-right 
            origin-top-right 
            right-0 
            z-40 
            w-max
            ${props.className}`}
      >
        {props.children}
      </Menu.Items>
    </Transition>
  );
};

export const MenuItem: React.FC = (props) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <div className={`px-3 py-1 ${active ? "bg-bg-blue" : ""}`}>
          {props.children}
        </div>
      )}
    </Menu.Item>
  );
};
