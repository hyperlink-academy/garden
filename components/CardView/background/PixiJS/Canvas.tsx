import * as React from "react";
import { Stage } from "react-pixi-fiber";

const width = 600;
const height = 400;

const options = {
  backgroundColor: 0x56789a,
  width: width,
  height: height
};

const style = {
  width: width,
  height: height
};

export function Canvas() {
  return (
    <Stage options={options} style={style}>
    </Stage>
  );
}