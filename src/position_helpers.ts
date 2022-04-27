import { Attribute } from "data/Attributes";
import { Fact } from "data/Facts";
import {
  generateKeyBetween,
  generateNKeysBetween,
} from "./fractional-indexing";

export const sortByPosition =
  (key: string) =>
  (
    a: Pick<Fact<keyof Attribute>, "positions" | "id">,
    b: Pick<Fact<keyof Attribute>, "positions" | "id">
  ) => {
    let aPosition = a.positions[key],
      bPosition = b.positions[key];
    if (!aPosition) {
      if (bPosition) return 1;
      return a.id > b.id ? 1 : -1;
    }
    if (!bPosition) return -1;
    if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
    return aPosition > bPosition ? 1 : -1;
  };

export const updatePositions = (
  positionKey: string,
  positions: Pick<Fact<keyof Attribute>, "positions" | "id">[],
  newIndexes: [string, number][]
) => {
  let hasUnpositionedItems = positions.reduce(
    (acc, child) => acc || !child.positions[positionKey],
    false
  );
  let newPositions: { [k: string]: string } = {};
  if (hasUnpositionedItems) {
    let newPositionsKeys = generateNKeysBetween(null, null, positions.length);
    for (let i = 0; i < positions.length; i++) {
      newPositions[positions[i].id] = newPositionsKeys[i];
    }
  }
  for (let i = 0; i < newIndexes.length; i++) {
    let [id, index] = newIndexes[i];
    let before = positions[index];
    let after = positions[index + 1];
    let newPosition = generateKeyBetween(
      newPositions[before?.id] || before?.positions[positionKey] || null,
      newPositions[after?.id] || after?.positions[positionKey] || null
    );
    newPositions[id] = newPosition;
  }
  return Object.entries(newPositions);
};
