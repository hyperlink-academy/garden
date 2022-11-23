import { createContext } from "react";

export const CardViewerContext = createContext({
  open: (_args: { focused: LinkContextType; entityID: string }) => {},
});

export const LinkContext = createContext({} as LinkContextType);

type LinkContextType =
  | { type: "desktop" }
  | { type: "entity"; entityID: string };

export const LinkContextProvider: React.FC<LinkContextType> = (props) => {
  return (
    <LinkContext.Provider value={props}>{props.children}</LinkContext.Provider>
  );
};
