import {
  CardSmall,
  ReactionAdd,
  CloseLinedTiny,
  Delete,
} from "components/Icons";
import { Divider } from "components/Layout";
import * as Popover from "@radix-ui/react-popover";
import { SERVER_PROPS_ID } from "next/dist/shared/lib/constants";

export const CardActionMenu = () => {
  return (
    <div className="cardActionMenu bg-grey-90 text-grey-35 border-grey-80 mb-6 flex items-center gap-2 rounded-full border px-2 py-1">
      <div className="bg-accent-blue text-md cardActionCounter relative flex h-6 place-items-center gap-1  rounded-full pl-1 pr-2 font-bold text-white">
        <CardSmall /> 4
      </div>
      <CardActionColorPicker />
      <div className="relative">
        <ReactionAdd />
      </div>
      <div className="h-6">
        <Divider vertical />
      </div>
      <div>
        <CloseLinedTiny />
      </div>
      <div className="h-6">
        <Divider vertical />
      </div>
      <div className="text-accent-red">
        <Delete />
      </div>
    </div>
  );
};

const cardSubmenuStyle = "p-2 bg-white lightBorder";

const CardActionColorPicker = () => {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <div className="cardActionColorPicker border-grey-80 relative h-6 w-6 rounded-full border bg-white" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content>
          <div className={cardSubmenuStyle}>
            hello
            <Popover.Close>
              <CloseLinedTiny />
            </Popover.Close>
          </div>
          <Popover.Arrow></Popover.Arrow>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
