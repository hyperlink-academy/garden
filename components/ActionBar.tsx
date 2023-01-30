// import React from "react";
import { CloseLinedTiny } from "./Icons";

export const ActionBar = (props: {
  selection: string[];
  setSelection: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  return (
    <div
      className={`actionBar py-4 px-6 ${
        props.selection.length > 0 ? "flex" : "hidden"
      }`}
    >
      <span>
        {props.selection.length} card{props.selection.length !== 1 ? "s" : ""}{" "}
        selected
      </span>
      <div className="flex-1"></div>
      <button
        className="hover:text-accent-blue"
        onClick={() => {
          props.setSelection([]);
        }}
      >
        <CloseLinedTiny />
      </button>
    </div>
  );
};
