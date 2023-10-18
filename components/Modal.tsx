import { useViewportSize } from "hooks/useViewportSize";
import { ButtonTertiary, ButtonPrimary } from "./Buttons";
import { Dialog } from "@headlessui/react";
// import { usePreventScroll } from "@react-aria/overlays";

export const Modal: React.FC<
  React.PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    dark?: boolean;
    width?: string;
    header?: string;
  }>
> = (props) => {
  let viewheight = useViewportSize().height;
  // usePreventScroll();

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      className="fixed inset-0 z-40 overflow-y-hidden"
    >
      <Dialog.Overlay className={props.dark ? "dark-overlay" : "overlay"} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: `calc(${viewheight}px - env(safe-area-inset-top) - 32px )`,
          top: `calc((${viewheight}px - env(safe-area-inset-top)) / 2)`,
          left: "50%",
          transform: `translate(-50%, -50% )`,
        }}
        className={`
        pwa-margin
        fixed
        left-1/2    
        z-40 h-max 
        w-[calc(100%-32px)] 
        bg-white text-grey-35
        ${props.width ? props.width : "max-w-md"} 
        flex 
        flex-col  gap-3 overflow-y-scroll rounded-md border border-grey-80
        px-3 py-4 shadow-drop sm:p-4
        `}
      >
        {props.header && <h2 className="">{props.header}</h2>}
        {props.open && props.children}
      </div>
    </Dialog>
  );
};

//Rename to submitModalButton when you do the rename of ModalNew
export const ModalSubmitButton = (props: {
  onClose: () => void;
  onSubmit?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  content: string;
  closeContent?: string;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactElement;
}) => {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <ButtonTertiary
        type="reset"
        onClick={() => {
          props.onClose();
        }}
        content={props.closeContent ? props.closeContent : "nevermind"}
      />
      <ButtonPrimary
        destructive={props.destructive}
        onClick={(e) => {
          if (props.onSubmit) {
            props.onSubmit(e);
          }
        }}
        content={props.content}
        type="submit"
        disabled={props.disabled}
        icon={props.icon}
      />
    </div>
  );
};
