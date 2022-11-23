import { createContext, useContext } from "react";

export const CardViewerContext = createContext({
  open: (_args: { entityID: string }) => {},
});

export const useCardViewer = () => {
  return useContext(CardViewerContext);
};
