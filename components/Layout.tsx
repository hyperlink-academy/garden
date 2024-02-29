import { Dialog, Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";

export const Divider = (props: {
  dark?: boolean;
  vertical?: boolean;
  mx?: number;
  my?: number;
}) => {
  return (
    <div
      className={` border-l border-t ${
        props.dark ? `border-grey-55` : `border-grey-80`
      } ${props.vertical ? "100vh h-full w-[1px]" : "h-[1px] w-full"}
      `}
      style={{
        margin: `${props.my || 0}px ${props.mx || 0}px ${props.my || 0}px ${
          props.mx || 0
        }px`,
      }}
    ></div>
  );
};

export const FloatingContainer: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = (props) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`
        border-grey-80 shadow-drop
        rounded-md border bg-white
        px-4
        py-4
        ${props.className}
        `}
    >
      {props.children}
    </div>
  );
};

export const ModalFixedHeight: React.FC<
  React.PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    dark?: boolean;
    width?: string;
  }>
> = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      className="fixed inset-0 z-50 overflow-y-hidden"
    >
      <Dialog.Overlay className={props.dark ? "dark-overlay" : "overlay"} />
      <FloatingContainer
        className={`
              fixed left-1/2 top-1/2 grid h-[calc(100%-32px)] w-[calc(100%-32px)] ${
                props.width ? props.width : "max-w-md"
              } -translate-x-1/2 -translate-y-1/2 grid-flow-row content-start gap-4 overflow-auto
              `}
      >
        {props.children}
      </FloatingContainer>
    </Dialog>
  );
};

export const LightBoxModal: React.FC<
  React.PropsWithChildren<{ open: boolean; onClose: () => void }>
> = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      className="fixed inset-0 z-50 overflow-y-hidden"
    >
      <Dialog.Overlay className="overlay" />
      <FloatingContainer
        // override default FloatingContainer border and padding!
        // also change to max-w + w-max, better for narrow images
        className={`
              fixed left-1/2 top-1/2 grid max-h-[calc(100%-100px)]
              w-max
              max-w-[calc(100%-50px)]
              -translate-x-1/2
              -translate-y-1/2 grid-flow-row
              gap-4
              overflow-auto
              border-none
              px-0 py-0
              `}
      >
        {props.children}
      </FloatingContainer>
    </Dialog>
  );
};

export const MenuContainer: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = (props) => {
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
            border-grey-80 shadow-drop absolute
            right-0 z-40
            flex w-max
            origin-top-right flex-col
            justify-items-end
            rounded-md
            border
            bg-white
            py-2
            text-right
            ${props.className}`}
      >
        {props.children}
      </Menu.Items>
    </Transition>
  );
};

export const MenuItem: React.FC<
  React.PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
  }>
> = (props) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          className={`flex justify-end gap-2 px-3 py-1 text-right ${
            active ? "bg-bg-blue" : ""
          } ${
            props?.disabled
              ? "text-grey-80 line-through hover:bg-transparent"
              : ""
          }`}
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
          onClick={() => props.onClick?.()}
          disabled={props?.disabled}
        >
          {props.children}
        </button>
      )}
    </Menu.Item>
  );
};
