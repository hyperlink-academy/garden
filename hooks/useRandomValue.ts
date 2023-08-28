import { useState } from "react";

export function useRandomValue<T>(values: Array<T>): T {
  let [index] = useState(Math.floor(Math.random() * values.length));
  return values[index];
}
