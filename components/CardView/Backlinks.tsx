import { Disclosure } from "@headlessui/react";
import { useSpring, animated } from "@react-spring/web";
import { CardPreview } from "components/CardPreview";
import { ExpandTiny } from "components/Icons";
import { useIndex, useMutations } from "hooks/useReplicache";
import useMeasure from "react-use-measure";

import { sortByPosition } from "src/position_helpers";

export const Backlinks = (props: { entityID: string }) => {
  let backlinks = useIndex.vae(props.entityID, "deck/contains");
  let homeEntity = useIndex.aev("home");
  let cards = backlinks
    .filter((c) => c.entity !== homeEntity[0]?.entity)
    .sort(sortByPosition("vae"));
  let { mutate } = useMutations();
  if (cards.length === 0) return null;
  return (
    <Disclosure>
      {({ open }) => (
        <div className="bg-bg-blue rounded-md px-4 py-2">
          <Disclosure.Button className="w-full flex flex-row justify-between outline-none">
            <h4 className="font-bold text-grey-35">
              {cards.length} Related {cards.length === 1 ? "Card" : "Cards"}
            </h4>
            <DropdownArrow open={open} />
          </Disclosure.Button>
          <Drawer open={open}>
            <Disclosure.Panel static>
              {open && (
                <div className="flex flex-col gap-2">
                  {cards.map((c) => {
                    return (
                      <CardPreview
                        factID={c.id}
                        onDelete={() => {
                          mutate("retractFact", { id: c.id });
                        }}
                        showRelated={true}
                        entityID={c.entity}
                        size={"big"}
                      />
                    );
                  })}
                </div>
              )}
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
  const { height } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    height: props.open ? innerHeight : 0,
  });

  return (
    <animated.div
      style={{
        height: height,
        overflow: "hidden",
      }}
    >
      <Disclosure.Panel static ref={ref} className="pt-2 text-sm">
        {props.children}
      </Disclosure.Panel>
    </animated.div>
  );
};
