import { Disclosure, Transition } from "@headlessui/react";
import { useSpring, animated } from "@react-spring/web";
import { CardStack } from "components/CardStack";
import { ExpandTiny } from "components/Icons";
import { useIndex } from "hooks/useReplicache";
import { usePrevious } from "hooks/utils";
import useMeasure from "react-use-measure";
import { sortByPosition } from "src/position_helpers";

export const Backlinks = (props: { entityID: string }) => {
  let backlinks = useIndex.vae(props.entityID, "deck/contains");
  let homeEntity = useIndex.aev("home");
  let cards = backlinks
    .filter((c) => c.entity !== homeEntity[0]?.entity)
    .sort(sortByPosition("vae"));
  if (cards.length === 0) return null;
  return (
    <Disclosure>
      {({ open }) => (
        <div className="bg-bg-blue rounded-md px-4 py-2">
          <Disclosure.Button className="w-full flex flex-row justify-between">
            <h4 className="font-bold text-grey-35">
              {cards.length} Related {cards.length === 1 ? "Card" : "Cards"}
            </h4>
            <DropdownArrow open={open} />
          </Disclosure.Button>
          <Drawer open={open}>
            <Disclosure.Panel static>
              <CardStack
                parent={props.entityID}
                cards={cards}
                backlink
                positionKey="vae"
                attribute={"deck/contains"}
              />
            </Disclosure.Panel>
          </Drawer>
        </div>
      )}
    </Disclosure>
  );
};

const DropdownArrow = (props: { open: boolean }) => {
  let { r } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    r: !props.open ? 90 : 0,
  });
  return (
    <animated.div
      className="self-center"
      style={{ transform: r.to((d) => `rotateZ(${d}deg)`) }}
    >
      <ExpandTiny />
    </animated.div>
  );
};

export const Drawer: React.FC<{
  open: boolean;
}> = (props) => {
  const [ref, { height: innerHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    height: props.open ? innerHeight : 0,
  });

  return (
    <animated.div
      style={{
        height: props.open && previousState === props.open ? "auto" : height,
        overflow: "hidden",
      }}
    >
      <Disclosure.Panel static ref={ref} className="pt-2 text-sm">
        {props.children}
      </Disclosure.Panel>
    </animated.div>
  );
};
