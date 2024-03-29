import { useViewportSize } from "hooks/useViewportSize";
import { ButtonTertiary, ButtonPrimary } from "./Buttons";
import { Dialog } from "@headlessui/react";
import { useEffect } from "react";
import { useUIState } from "hooks/useUIState";
import { CloseLinedTiny } from "./Icons";

export const Modal: React.FC<
  React.PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    dark?: boolean;
    width?: string;
    header?: string;
    noCloseButton?: boolean;
  }>
> = (props) => {
  let viewheight = useViewportSize().height;
  let setMobileSidebarOpen = useUIState((s) => s.setMobileSidebarOpen);
  useEffect(() => {
    if (props.open) setMobileSidebarOpen(false);
  }, [props.open, setMobileSidebarOpen]);

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
        no-scrollbar
        pwa-margin
        pwa-margin-bottom
        text-grey-35
        fixed
        left-1/2 z-40
        h-max
        w-[calc(100%-32px)] bg-white
        ${props.width ? props.width : "max-w-md"}
        border-grey-80
        shadow-drop  flex flex-col gap-3 overflow-y-scroll rounded-md
        border px-3 py-4 sm:p-4
        `}
      >
        {!props.header && props.noCloseButton ? null : (
          <div className="flex w-full items-center">
            <h3 className="grow">{props.header && props.header}</h3>
            {!props.noCloseButton && (
              <button
                className="shrink0 text-grey-55 hover:text-accent-blue grow-0"
                onClick={() => props.onClose()}
              >
                <CloseLinedTiny />
              </button>
            )}
          </div>
        )}

        {props.open && props.children}
      </div>
    </Dialog>
  );
};

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
