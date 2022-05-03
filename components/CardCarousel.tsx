import { ButtonLink } from "components/Buttons";
import { CardView } from "components/CardView";
import { Card, LeftArrow, RightArrow, Shuffle } from "components/Icons";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

let smooth = false;
export const CardCarousel = (props: {
  entityID: string;
  backlink?: boolean;
  section: string;
  cards: Fact<keyof ReferenceAttributes>[];
}) => {
  let [position, setPosition] = useState(0);
  let router = useRouter();
  let selectedChild = router.query.child as string;
  let Name = useIndex.eav(props.entityID, "card/title");

  useEffect(() => {
    let index = props.cards.findIndex((c) => {
      let entity = props.backlink ? c.entity : c.value.value;
      return entity === selectedChild;
    });
    if (index !== -1) setPosition(index);
  }, [props.cards, selectedChild]);

  return (
    <div className="h-full flex flex-col items-stretch relative pt-8">
      <div className="px-4 grid grid-flow-col items-center w-full pr-10 pb-2">
        <h4 className="uppercase text-accent-blue font-bold">{`${Name?.value} ${
          props.section === "deck/contains" ? "" : props.section.slice(8)
        }`}</h4>
      </div>
      <div
        className={`overflow-x-scroll flex snap-x snap-mandatory gap-4 px-4 no-scrollbar h-full`}
      >
        {props.cards.map((c) => {
          let entity = props.backlink ? c.entity : c.value.value;
          return (
            <CardContainer
              selected={selectedChild === c.value.value}
              key={entity}
              entity={entity}
            >
              <CardView entityID={entity} />
            </CardContainer>
          );
        })}
      </div>
      <div className="grid grid-flow-col gap-1 pb-3 px-5">
        <CardCounter
          position={position}
          length={props.cards.length}
          setPosition={(pos) => {
            let card = props.cards[pos];
            let entity = props.backlink ? card.entity : card.value.value;
            smooth = true;
            let q = router.query;
            router.replace(
              `/s/${q.studio}/s/${q.space}/c/${q.card}/${
                props.backlink ? "b" : "a"
              }/${q.attribute}/${entity}`
            );
          }}
        />
        <div className="justify-items-end grid pt-2">
          <ButtonLink icon={<Card />} content="Add Card!" />
        </div>
      </div>
    </div>
  );
};

const CardContainer: React.FC<{ selected: boolean; entity: string }> = (
  props
) => {
  let ref = useRef<HTMLDivElement>(null);
  let router = useRouter();
  useEffect(() => {
    let timeout: number | undefined = undefined;
    let node = ref.current;
    let observer = new IntersectionObserver(
      (e) => {
        if (!e[0]?.isIntersecting && timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        if (e[0]?.isIntersecting && router.query.child !== props.entity) {
          timeout = window.setTimeout(() => {
            let q = router.query;
            router.replace(
              `/s/${q.studio}/s/${q.space}/c/${q.card}/a/${q.attribute}/${props.entity}`
            );
          }, 750);
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );
    setTimeout(() => {
      if (node) observer.observe(node);
    }, 500);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [ref, props.entity, router]);

  useEffect(() => {
    if (!ref.current) return;
    if (!props.selected) return;
    console.log(props.entity, "should be scrolled!");
    //@ts-ignore
    if (ref.current.scrollIntoViewIfNeeded) {
      //@ts-ignore
      ref.current.scrollIntoViewIfNeeded();
    } else {
      console.log("scrolling into view!", props.entity);
      ref.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
    smooth = false;
  }, [props.selected, props.entity]);
  return (
    <div
      ref={ref}
      style={{ maxWidth: "calc(100% - 16px)" }}
      className={`h-full snap-center flex-shrink-0 pb-1.5 w-full`}
    >
      {props.children}
    </div>
  );
};

const CardCounter = (props: {
  position: number;
  length: number;
  setPosition: (n: number) => void;
}) => {
  return (
    <div className="w-fit grid grid-flow-col gap-2 self-end">
      <button
        onClick={() => {
          if (props.position > 0) props.setPosition(props.position - 1);
        }}
      >
        <LeftArrow className="text-accent-blue" />
      </button>
      <div className="text-grey-35 font-bold grid content-center">{`${
        props.position + 1
      } / ${props.length}`}</div>
      <button
        onClick={() => {
          if (props.position < props.length - 1)
            props.setPosition(props.position + 1);
        }}
      >
        <RightArrow className="text-accent-blue" />
      </button>
      <button
        onClick={() => {
          props.setPosition(Math.floor(Math.random() * props.length));
        }}
        className="text-accent-blue content-center grid w-min"
      >
        <Shuffle />
      </button>
    </div>
  );
};
