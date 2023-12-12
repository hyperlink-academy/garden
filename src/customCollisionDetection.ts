import {
  DroppableContainer,
  closestCorners,
  pointerWithin,
} from "@dnd-kit/core";
import { CollisionDetection } from "@dnd-kit/core";
import { DroppableData } from "components/DragContext";

export function customCollisionDetection(
  args: Parameters<CollisionDetection>[0]
) {
  let sortedCollisions = args.droppableContainers.reduce(
    (acc, container) => {
      let data = container.data.current as DroppableData;
      if (data.type === "collectionCard") acc.closestCorners.push(container);
      else acc.pointerWithin.push(container);
      return acc;
    },
    { closestCorners: [], pointerWithin: [] } as {
      closestCorners: DroppableContainer[];
      pointerWithin: DroppableContainer[];
    }
  );
  let pointerWithinCollisions = pointerWithin({
    ...args,
    droppableContainers: sortedCollisions.pointerWithin,
  });

  // First, let's see if there are any collisions with the pointer
  if (pointerWithinCollisions.length > 0) {
    return pointerWithinCollisions.sort((a, b) =>
      b.id === "mobile-sidebar-overlay" ? 1 : 0
    );
  }

  return closestCorners({
    ...args,
    droppableContainers: sortedCollisions.closestCorners,
  });
  // Collision detection algorithms return an array of collisions
  //if (pointerCollisions.length > 0) {
  //    return pointerCollisions;
  //}

  // If there are no collisions with the pointer, return rectangle intersections
  // return rectIntersection(args)
}
