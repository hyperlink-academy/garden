import { ButtonLink } from "components/Buttons";
import { CardView } from "components/CardView";
import { Card, LeftArrow, RightArrow, Shuffle } from "components/Icons";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useIndex, useMutations } from "hooks/useReplicache";
import Head from "next/head";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";

let smooth = false;
export const CardCarousel = (props: {
  entityID: string;
  backlink?: boolean;
  section: string;
  cards: Fact<keyof ReferenceAttributes>[];
}) => {
  let router = useRouter();
  let [selectedChild, setSelectedChild] = useState(router.query.child);
  let { mutate, authorized } = useMutations();
  let Name = useIndex.eav(props.entityID, "card/title");
  const position = props.cards.findIndex((c) => {
    let entity = props.backlink ? c.entity : c.value.value;
    return entity === selectedChild;
  });

  return (
    <div className="h-full flex flex-col items-stretch relative">
      <div className="grid grid-flow-col items-center w-full px-1 pb-2">
        <h4 className="uppercase text-accent-blue font-bold max-w-3xl mx-auto w-full">
          <Link
            href={`/s/${router.query.studio}/s/${router.query.space}/c/${props.entityID}`}
          >
            <a>{Name?.value}</a>
          </Link>
          <span className="text-grey-35">
            {props.section === "deck/contains"
              ? ""
              : ` > ${props.section.slice(8)}`}
          </span>
        </h4>
      </div>
      <div
        style={{
          padding: "0 max(calc((100vw - 48rem) / 2), 1rem)",
        }}
        className={`overflow-x-scroll flex snap-x snap-mandatory gap-4 -mx-4 no-scrollbar h-full`}
      >
        {props.cards.map((c) => {
          let entity = props.backlink ? c.entity : c.value.value;
          return (
            <CardContainer
              onFocus={() => setSelectedChild(entity)}
              selected={selectedChild === entity}
              key={entity}
              entity={entity}
            >
              <CardView entityID={entity} referenceFactID={c.id} />
            </CardContainer>
          );
        })}
      </div>
      <div className="grid grid-flow-col gap-1 pb-6 pt-1 max-w-3xl mx-auto w-full">
        <CardCounter
          position={position}
          length={props.cards.length}
          setPosition={(pos) => {
            let card = props.cards[pos];
            let entity = props.backlink ? card.entity : card.value.value;
            smooth = true;
            setSelectedChild(entity);
          }}
        />
        {!authorized || props.backlink ? null : (
          <div className="justify-items-end grid">
            <ButtonLink
              icon={<Card />}
              content="Add Card!"
              onClick={async () => {
                let newCard = ulid();
                await mutate("createCard", {
                  entityID: newCard,
                  title: "",
                });
                await mutate("addCardToSection", {
                  cardEntity: newCard,
                  parent: props.entityID,
                  positions: {
                    eav: generateKeyBetween(
                      props.cards[props.cards.length - 1]?.positions.eav ||
                        null,
                      null
                    ),
                  },
                  section: props.section,
                });
                setSelectedChild(newCard);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const CardContainer: React.FC<{
  selected: boolean;
  entity: string;
  onFocus: () => void;
}> = (props) => {
  let ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timeout: number | undefined = undefined;
    let node = ref.current;
    let observer = new IntersectionObserver(
      (e) => {
        if (!e[0]?.isIntersecting && timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        if (e[0]?.isIntersecting) {
          timeout = window.setTimeout(() => {
            if (window.location.href.endsWith(props.entity)) return;
            if (!e[0]?.isIntersecting) return;
            let q = Router.query;
            let newUrl = `/s/${q.studio}/s/${q.space}/c/${q.card}/a/${q.attribute}/${props.entity}`;
            window.history.replaceState(
              { ...window.history.state, as: newUrl, url: newUrl },
              "",
              newUrl
            );
            props.onFocus();
          }, 100);
        }
      },
      { root: null, rootMargin: "0px -50%", threshold: 0 }
    );
    setTimeout(() => {
      if (node) observer.observe(node);
    }, 100);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [ref, props.entity, props.selected]);

  useEffect(() => {
    if (!ref.current) return;
    if (!props.selected) return;
    //@ts-ignore
    if (ref.current.scrollIntoViewIfNeeded) {
      //@ts-ignore
      ref.current.scrollIntoViewIfNeeded({
        behavior: smooth ? "smooth" : "auto",
        inline: "center",
      });
    } else {
      ref.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        inline: "center",
      });
    }
    ref.current.focus();
    smooth = false;
  }, [props.selected, props.entity]);
  return (
    <div
      tabIndex={0}
      ref={ref}
      onClick={() => {
        let q = Router.query;
        if (q.entity === props.entity) return;
        ref.current?.scrollIntoView({ behavior: "smooth", inline: "center" });
      }}
      className={`h-full w-full snap-center flex-shrink-0 pb-1.5 focus:outline-none`}
    >
      {props.selected ? (
        <CardCarouselTitle parent={""} child={props.entity} />
      ) : null}
      {props.children}
    </div>
  );
};

const CardCarouselTitle = (props: { parent: string; child: string }) => {
  let parentTitle = useIndex.eav(props.parent, "card/title");
  let childTitle = useIndex.eav(props.child, "card/title");

  return (
    <Head>
      <title key="title">{childTitle?.value || "Untitled"}</title>
    </Head>
  );
};

const CardCounter = (props: {
  position: number;
  length: number;
  setPosition: (n: number) => void;
}) => {
  return (
    <div className="w-fit grid grid-flow-col gap-2 self-end ">
      <button
        onClick={() => {
          if (props.position > 0) props.setPosition(props.position - 1);
          else props.setPosition(props.length - 1);
        }}
      >
        <LeftArrow />
      </button>
      <div className="text-grey-35 font-bold grid content-center">{`${
        props.position + 1
      } / ${props.length}`}</div>
      <button
        onClick={() => {
          if (props.position < props.length - 1)
            props.setPosition(props.position + 1);
          else props.setPosition(0);
        }}
      >
        <RightArrow />
      </button>
      <button
        onClick={() => {
          props.setPosition(Math.floor(Math.random() * props.length));
        }}
        className=" content-center grid w-min"
      >
        <Shuffle />
      </button>
    </div>
  );
};
