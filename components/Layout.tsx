import { Dialog, Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";

export const Divider = (props: { dark?: boolean }) => {
  return (
    <div
      className={`border-t  w-full ${
        props.dark ? `border-grey-55` : `border-grey-80`
      }`}
    ></div>
  );
};

export const FloatingContainer: React.FC<{ className?: string }> = (props) => {
  return (
    <div
      className={`
        px-6 py-8
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
              overflow-auto
              max-h-[calc(100%-32px)]
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
            border border-grey-80 rounded-md 
            shadow-drop bg-white 
            absolute justify-items-end 
            flex flex-col
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

export const MenuItem: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
}> = (props) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          className={`px-3 py-4 flex items-center gap-2 justify-end ${
            active ? "bg-bg-blue" : ""
          } ${
            props?.disabled
              ? " hover:bg-transparent text-grey-80 line-through"
              : ""
          }`}
          onClick={() => props.onClick?.()}
          disabled={props?.disabled}
        >
          {props.children}
        </button>
      )}
    </Menu.Item>
  );
};
