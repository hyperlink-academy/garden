import React, { useState, useRef } from "react";
import { useMutations } from "hooks/useReplicache";

export function useUndoableState<S>(
  initialState: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>, (state: S) => void] {
  let [state, dispatch] = useState(initialState);
  let ref = useRef(initialState);
  let { action } = useMutations();

  return [
    state,
    (newState) => {
      let current: S,
        past = ref.current as S;
      if (typeof newState == "function") {
        current = (newState as (prevState: S) => S)(past);
      } else {
        current = newState;
      }

      action.add({
        undo() {
          ref.current = past;
          dispatch(past);
        },
        redo() {
          ref.current = current;
          dispatch(current);
        },
      });

      dispatch(current);

      ref.current = current;
    },
    (newState) => {
      dispatch(newState)
    }
  ];
}
