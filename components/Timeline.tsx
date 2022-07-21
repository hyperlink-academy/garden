import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { useIndex, useMutations } from "hooks/useReplicache";
import { Disclosure } from "@headlessui/react";

import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";

import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import { CardAdd, DeckAdd, Settings } from "./Icons";

/* 
TODO: Create route + index page (prob /log or /timeline - TBD)
*/

export const Timeline = () => {
  const today = new Date();
  const todaystr = today.toLocaleDateString();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowstr = tomorrow.toLocaleDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaystr = yesterday.toLocaleDateString();

  const dayaftertomorrow = new Date();
  dayaftertomorrow.setDate(dayaftertomorrow.getDate() + 2);

  //   const week = [1, 2, 3, 4, 5, 6, 7];
  //   const nextweek = TK;

  //   {days.map((a) => (
  // 	<Day day={a} />
  //   ))}

  function getweek(startdate: Date) {
    var week = new Array();
    // startdate.setDate(startdate.getDate() - startdate.getDay() + 1);
    for (var i = 0; i < 7; i++) {
      week.push(new Date(startdate));
      startdate.setDate(startdate.getDate() + 1);
    }
    return week;
  }
  const nextweek = getweek(new Date(dayaftertomorrow));
  console.log(nextweek);

  const nextweekstr = nextweek.map((a) => a.toLocaleDateString());
  console.log(nextweekstr);

  return (
    /*
	Timeline - build dynamically based on Days / Weeks visible

	Get matching data:
	Cards with datetime sections
	Past things that have been auto-logged e.g. did N activity sessions, etc.

	Render timeline preview / collapsed: yesterday, today, tomorrow
	
	Once expanded click again to show e.g. week of X (maybe by month too?)
	Each time section (Day / Week) is collapsible after expanded (or reload)
	*/

    <div className="">
      <h1>Timeline</h1>
      <PrevWeek />
      <Yesterday datestr={yesterdaystr} />
      <Today datestr={todaystr} />
      <Tomorrow datestr={tomorrowstr} />
      <ThisWeek weekstr={nextweekstr} />
      <NextWeek />
    </div>
  );
};

const Today = (props: { datestr: string }) => {
  return (
    <div className="py-4">
      <h2>today</h2>
      <Day day={props.datestr} />
    </div>
  );
};

const Yesterday = (props: { datestr: string }) => {
  return (
    <div className="py-4">
      <h2>yesterday</h2>
      <Day day={props.datestr} />
    </div>
  );
};

const Tomorrow = (props: { datestr: string }) => {
  return (
    <div className="py-4">
      <h2>tomorrow</h2>
      <Day day={props.datestr} />
    </div>
  );
};

const Day = (props: { day: string }) => {
  return (
    <div>
      <div className="">{props.day}</div>
      <List />
    </div>
    /*
	show either relative e.g. today, or date in future
	*/
  );
};

const ThisWeek = (props: { weekstr: Array<string> }) => {
  return <Week weekstr={props.weekstr} />;
};

const Week = (props: { weekstr: Array<string> }) => {
  //   let days = ["1", "2", "3", "4", "5", "6", "7"];
  //   let days = [{ date: "jan 11", dayofweek: "mon" },];
  return (
    <Disclosure as="div" className="py-4">
      {/* <button
		  onClick={(e) => {
			setDrawerOpen(!drawerOpen);
		  }}
		>
		</button> */}
      <h2>week of {props.weekstr[0]}</h2>
      <Disclosure.Button
        as={ButtonLink}
        content="show/hide"
        className=""
      ></Disclosure.Button>
      <Disclosure.Panel>
        <div>
          {props.weekstr.map((a) => (
            <Day day={a} />
          ))}
        </div>
      </Disclosure.Panel>
    </Disclosure>
  );
};

const List = () => {
  //   let items = ["thing one", "a second thing we did", "a third cool thing"];
  let items = [""];
  return (
    // e.g. set of log items to show in a Day list
    <div className="">
      <ul>
        {items.map((a) => (
          <ListItem content={a} />
        ))}
      </ul>
    </div>
  );
};

const ListItem = (props: { content: string }) => {
  return <li className="">{props.content}</li>;
};

const PrevWeek = () => {
  // expand prev week + on click get data for that time period
  return (
    <div className="py-2">
      <ButtonLink content="show prev week"></ButtonLink>
    </div>
  );
};

const NextWeek = () => {
  // expand next week + on click get data for that time period
  return (
    <div className="py-2">
      <ButtonLink content="show next week"></ButtonLink>
    </div>
  );
};
