"use client";
import styles from "styles/Landing.module.css";
import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { BackToHome, Send } from "components/Icons";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoginOrSignupModal } from "components/LoginModal";

export function HomePage() {
  let textFormat = "mx-auto w-full flex max-w-2xl flex-col gap-4";
  let [loginOrSignupState, setLoginOrSignupState] =
    LoginOrSignupModal.useState("closed");

  let { session } = useAuth();
  let router = useRouter();

  return (
    <>
      <div className="landing px-4 py-4 md:px-8 md:py-8">
        {/* main content - inner wrapper */}
        <div className="m-auto mb-8 flex max-w-6xl flex-col gap-8">
          {/* title */}
          <div className="landingTitle flex flex-col justify-center gap-8 text-center ">
            {/* hyperlink */}
            <div className="flex flex-col">
              <div className="border-accent-red z-10 -mb-[12px] flex w-3/4 rounded-md border-[12px] p-2 text-sm sm:-mb-[24px] sm:w-1/2 sm:border-[24px] sm:p-4 sm:text-base md:w-1/3">
                <div className="m-auto flex gap-2 self-center">
                  <span>
                    <em>hello! welcome to…</em>
                  </span>
                </div>
              </div>
              <div className="border-accent-gold w-11/12 self-center rounded-md border-x-[24px] border-y-[24px] p-4 sm:border-x-[96px] sm:border-y-[48px] sm:p-8">
                <h1 className="plexSerifBoldItalic text-2xl sm:text-[3rem] md:text-7xl">
                  Hyperlink Academy
                </h1>
              </div>
              <div className="border-accent-blue z-10 -mt-[12px] flex w-4/5 self-end rounded-md border-[12px] p-2 text-sm sm:-mt-[24px] sm:w-1/2 sm:border-[24px] sm:p-4 sm:text-base md:w-1/3">
                {/* login / signup links */}
                <div className="m-auto flex flex-row gap-2 self-center">
                  {!session?.loggedIn ? (
                    <>
                      <ButtonLink
                        content="sign up"
                        onClick={() => setLoginOrSignupState("signup")}
                      />
                      <span>
                        <em>or</em>
                      </span>
                      <ButtonLink
                        content="log in"
                        onClick={() => setLoginOrSignupState("login")}
                      />
                      <LoginOrSignupModal
                        state={loginOrSignupState}
                        setState={setLoginOrSignupState}
                        onLogin={(s) =>
                          s.username
                            ? router.push(`/s/${s.username}`)
                            : router.push("/setup")
                        }
                      />
                    </>
                  ) : session.session?.username ? (
                    <Link
                      href={`/s/${session.session.username}`}
                      className="hover:text-accent-blue mx-auto flex items-center justify-center gap-2"
                    >
                      <BackToHome />
                      <span>
                        <strong>visit my homepage</strong>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={`/setup`}
                      className="hover:text-accent-blue mx-auto flex items-center justify-center gap-2"
                    >
                      <BackToHome />
                      <span>
                        <strong>finish account setup!</strong>
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* what is hyperlink */}
          <div className={`landingWhatIsHyperlink text-center ${textFormat}`}>
            <h2 className="text-xl sm:text-3xl">What is Hyperlink?</h2>
            <p className="text-lg">
              It&apos;s where we make <strong>Spaces</strong> to make things
              happen — places to do meaningful work with close collaborators.
            </p>
            <div className="my-4 flex flex-col gap-4 sm:flex-row">
              <div className="flex w-3/4 flex-col gap-2 self-center rounded-md border bg-white p-2 sm:w-1/3 sm:gap-4 sm:p-4">
                <h3>intimate groups</h3>
                <Image
                  src="/landing/Chairs.png"
                  alt=""
                  width={128}
                  height={128}
                  className="w-1/2 self-center sm:w-full"
                  style={{ imageRendering: "pixelated" }}
                />
                <p className="text-sm italic">
                  run a book club or writing circle
                </p>
              </div>
              <div className="flex w-3/4 flex-col gap-2 self-center rounded-md border bg-white p-2 sm:w-1/3 sm:gap-4 sm:p-4">
                <h3>creative collaboration</h3>
                <Image
                  src="/landing/Notes.png"
                  alt=""
                  width={128}
                  height={128}
                  className="w-1/2 self-center sm:w-full"
                  style={{ imageRendering: "pixelated" }}
                />
                <p className="text-sm italic">
                  start and finish projects with friends
                </p>
              </div>
              <div className="flex w-3/4 flex-col gap-2 self-center rounded-md border bg-white p-2 sm:w-1/3 sm:gap-4 sm:p-4">
                <h3>shared worlds</h3>
                <Image
                  src="/landing/Plants.png"
                  alt=""
                  width={128}
                  height={128}
                  className="w-1/2 self-center sm:w-full"
                  style={{ imageRendering: "pixelated" }}
                />
                <p className="text-sm italic">
                  space to explore and experiment together
                </p>
              </div>
            </div>
          </div>
          <DividerSmall />
          {/* hyperlink in action */}
          <div className={`hyperlinkInAction ${textFormat} text-center`}>
            <div className="mb-4 flex flex-col gap-4">
              <h2 className="text-xl sm:text-2xl">What does it look like?</h2>
              <span>
                <em>click each item for a preview!</em>
              </span>
            </div>
            {/* hyperlink demo layout */}
            <div className="demoWrapper mb-16 mt-48 scale-100">
              <Features />
              {/* disclosure section - all features + one video panel */}
              <div className="my-8 flex h-96 w-full rounded-md border-2 shadow-lg">
                {/* rooms */}
                <div className="flex h-full w-[calc(25%-8px)] flex-col gap-2 rounded-md border-r bg-white p-2 sm:w-[calc(25%-16px)] sm:p-4">
                  <div className="bg-grey-90 h-4 w-[75%] rounded-md"></div>
                  <hr className="border-grey-80 my-2" />
                  <div className="bg-grey-90 h-4 rounded-md"></div>
                  <div className="bg-accent-blue h-4 rounded-md"></div>
                  <div className="bg-grey-90 h-4 rounded-md"></div>
                  <div className="bg-grey-90 h-4 rounded-md"></div>
                  <hr className="border-grey-80 my-2" />
                  <div className="bg-bg-blue h-4 rounded-md"></div>
                  <div className="bg-bg-red h-4 rounded-md"></div>
                  <div className="bg-bg-gold h-4 rounded-md"></div>
                </div>
                {/* canvas */}
                <div className="m-2 h-[calc(100%-16px)] w-[calc(30%-8px)] sm:m-4 sm:h-[calc(100%-32px)] sm:w-[calc(30%-16px)]">
                  <div className="relative h-12 w-16 rounded-md border bg-white sm:h-14 sm:w-20"></div>
                  <div className="unreadCardGlow relative left-6 top-4 h-12 w-16 -rotate-6 rounded-md border bg-white sm:left-10 sm:h-14 sm:w-20"></div>
                  <div className="relative left-3 top-8 h-12 w-16 rotate-3 rounded-md border bg-white sm:h-14 sm:w-20"></div>
                  <div className="unreadCardGlow relative left-2 top-14 h-12 w-16 rounded-md border bg-white sm:h-14 sm:w-20"></div>
                  <div className="relative left-8 top-12 h-12 w-16 rotate-3 rounded-md border bg-white sm:left-12 sm:top-8 sm:h-14 sm:w-20"></div>
                </div>
                {/* open card */}
                <div className="m-2 flex h-[calc(100%-16px)] w-[calc(45%-16px)] flex-col justify-between gap-4 rounded-md border bg-white p-4 sm:m-4 sm:h-[calc(100%-32px)]">
                  <div className="flex flex-col gap-4">
                    <div className="bg-grey-90 h-6 w-[50%] rounded-md"></div>
                    <div className="flex h-fit flex-col gap-1">
                      <div className="bg-grey-90 h-4 rounded-md"></div>
                      <div className="bg-grey-90 h-4 rounded-md"></div>
                      <div className="bg-grey-90 h-4 rounded-md"></div>
                      <div className="bg-grey-90 h-4 rounded-md"></div>
                    </div>
                  </div>
                  <div className="flex w-full flex-row items-center gap-2">
                    <div className="text-grey-80 flex h-fit w-full flex-col gap-1 rounded-md border bg-white p-2 text-left text-sm">
                      <div className="bg-grey-90 h-4 w-full rounded-md"></div>
                      <div className="bg-grey-90 h-4 w-[80%] rounded-md"></div>
                    </div>
                    <div className="text-accent-blue self-end">
                      <Send />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* even more features */}
            <div className="m-auto mt-12 flex flex-col gap-2 rounded-md border bg-white p-4 text-left">
              <h3 className="text-center">and lots more!</h3>
              <ul className="ml-4 list-disc text-sm sm:text-base">
                <li>
                  <strong>calendar</strong>: plan & log the things you do
                </li>
                <li>
                  <strong>search</strong>: easily find any card
                </li>
                <li>
                  <strong>reactags</strong>: a fun way to label things
                </li>
                <li>
                  <strong>notifications</strong>: see new cards & discussions
                </li>
              </ul>
            </div>
          </div>
          <DividerSmall />
          {/* get started CTA! */}
          <div className={`getStarted text-center ${textFormat}`}>
            <h2 className="pb-4 text-xl leading-loose sm:text-3xl sm:leading-[3rem]">
              <span className="text-lg sm:text-xl">Set up your new</span>
              <br />
              <span className="border-accent-blue rounded-md border-b-4 px-2 py-1">
                Studio
              </span>
              {""}•{""}
              <span className="border-accent-gold rounded-md border-b-4 px-2 py-1">
                Lab
              </span>
              {""}•
              <span className="border-accent-red rounded-md border-b-4 px-2 py-1">
                Campus
              </span>
            </h2>
            <div className="my-4 flex scale-125 self-center">
              {/* NB: opens same modal as above - just an extra button here! */}
              <ButtonPrimary
                content="create your account!"
                onClick={() => setLoginOrSignupState("signup")}
              />
            </div>

            <p className="text-lg">
              We&apos;d love to answer any questions & hear more about how you
              imagine using Hyperlink —{" "}
              <a
                href="mailto:contact@hyperlink.academy"
                className="text-accent-blue"
              >
                send us a note ✨🌱
              </a>
            </p>
          </div>
          <DividerSmall />
        </div>
        {/* about hyperlink wrapper */}
        <div className="bg-bg-blue -mx-4 -mb-4 px-4 py-8 sm:-mx-8 sm:-mb-8 sm:px-8">
          {/* who and why */}
          <div className={`whoAndWhy1 text-center ${textFormat}`}>
            <h2 className="text-xl sm:text-2xl">About Hyperlink</h2>
            <p>
              We&apos;re a small team —{" "}
              <a className="text-accent-blue" href="https://awarm.space/">
                Jared
              </a>
              ,{" "}
              <a className="text-accent-blue" href="https://celinepark.design/">
                Celine
              </a>
              ,{" "}
              <a
                className="text-accent-blue"
                href="https://www.brendanschlagel.com/"
              >
                Brendan
              </a>{" "}
              — supported by great investors, collaborators, co-explorers &
              friends.
            </p>
            <p>Here&apos;s our path so far:</p>
          </div>
          {/* hyperlink history */}
          <div
            className={`whoAndWhy2 mb-32 mt-4 items-center text-center ${textFormat}`}
          >
            <div className="relative right-4 top-6 flex w-64 rotate-6 flex-col gap-2 rounded-md border bg-white p-4 sm:right-16">
              <p className="bg-accent-gold m-auto w-fit rounded-full px-3 py-1 text-xs italic">
                2020–2021
              </p>
              <h3 className="text-base">Hyperlink Academy 1.0</h3>
              <p className="text-sm">
                an indie internet course platform for seriously effective
                learning
              </p>
              <button className="m-auto w-fit rounded-md border bg-[white] p-2 text-sm text-black hover:bg-[black] hover:text-[white]">
                <a href="https://year-one.hyperlink.academy/">
                  hyperlink archive →
                </a>
              </button>
            </div>
            <div className="relative left-4 top-8 flex w-64 -rotate-3 flex-col gap-2 rounded-md border bg-white p-4 sm:left-16">
              <p className="bg-accent-gold m-auto w-fit rounded-full px-3 py-1 text-xs italic">
                2020–present
              </p>
              <h3 className="text-base">Hypotenuse</h3>
              <p className="text-sm">
                our newsletter on learning futures & the process of building
                hyperlink
              </p>
              <button className="text-accent-blue hover:bg-accent-blue m-auto w-fit rounded-md border bg-[white] p-2 text-sm hover:text-white">
                <a href="https://year-one.hyperlink.academy/">
                  subscribe here →
                </a>
              </button>
            </div>
            <div className="relative right-2 top-12 flex w-64 rotate-2 flex-col gap-2 rounded-md border bg-white p-4">
              <p className="bg-accent-gold m-auto w-fit rounded-full px-3 py-1 text-xs italic">
                2021
              </p>
              <h3 className="text-base">Hyperspace</h3>
              <p className="text-sm">
                collaborative digital garden and text-based playground
              </p>
            </div>
            <div className="relative left-6 top-16 flex w-64 -rotate-3 flex-col gap-2 rounded-md border bg-white p-4 sm:left-20">
              <p className="bg-accent-gold m-auto w-fit rounded-full px-3 py-1 text-xs italic">
                2022–2023
              </p>
              <h3 className="text-base">
                [interlude] — a whole lotta thinking…
              </h3>
              <p className="text-sm">
                research, prototyping, exploring new directions for what we want
                to build
              </p>
            </div>
            <div className="relative top-24 flex w-64 flex-col gap-2 rounded-md border bg-white p-4">
              <p className="bg-accent-gold m-auto w-fit rounded-full px-3 py-1 text-xs italic">
                2023
              </p>
              <h3 className="text-base">Hyperlink Academy 2.0</h3>
              <p className="text-sm">
                a place to play and learn with friends; spaces for doing
                meaningful things together
              </p>
              <hr className="border-grey-80 m-auto my-2 w-[25px]" />
              <p className="text-sm">intrigued? to try Hyperlink…</p>
              <div className="my-0 flex self-center">
                {/* NB: opens same modal as above - just an extra button here! */}
                <ButtonPrimary
                  content="create your account!"
                  onClick={() => setLoginOrSignupState("signup")}
                />
              </div>
            </div>
          </div>
          <Image
            src="/landing/creator-landing-cover.png"
            alt=""
            width={754}
            height={574}
            className="m-auto"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        {/* END LANDING WRAPPER */}
      </div>
      <hr className=" border-grey-80" />
      <div className="text-grey-55 flex flex-row gap-2 px-2 text-sm italic">
        <Link href="/privacy" className="hover:text-accent-blue">
          privacy policy
        </Link>{" "}
        |{" "}
        <Link href="/terms" className="hover:text-accent-blue">
          terms
        </Link>
      </div>
    </>
  );
}

const Features = () => {
  let [activeVideo, setActiveVideo] = useState("");
  return (
    <div>
      <Feature
        name="Spaces"
        setActiveVideo={() => {
          setActiveVideo(activeVideo === "spaces" ? "" : "spaces");
        }}
        description="containers for structured social activity"
        buttonClass={`${styles.cardAnimation0} hover:bg-[#fffaff]`}
        positionClass="absolute right-[0] left-[0] top-[-185px] z-50"
      />
      <Feature
        name="Cards"
        setActiveVideo={() => {
          setActiveVideo(activeVideo === "cards" ? "" : "cards");
        }}
        description="represent meaningful things—questions, tasks, ideas…"
        buttonClass={`${styles.cardAnimation1} hover:bg-[#fffdf8]`}
        positionClass="absolute right-[0px] top-[-100px] z-50"
      />
      <Feature
        name="Rooms"
        setActiveVideo={() => {
          setActiveVideo(activeVideo === "rooms" ? "" : "rooms");
        }}
        description="organize & work with things"
        buttonClass={`${styles.cardAnimation2} hover:bg-[#fff9f9]`}
        positionClass="absolute left-[8px] sm:left-[-20px] top-[-20px] z-50"
      />
      <Feature
        name="Discussions"
        setActiveVideo={() => {
          setActiveVideo(activeVideo === "discussions" ? "" : "discussions");
        }}
        description="talk about things in focused contexts"
        buttonClass={`${styles.cardAnimation3} hover:bg-[#f9f9fd]`}
        positionClass="absolute right-[20px] bottom-[-28px] z-50"
      />
      <Feature
        name="Members"
        setActiveVideo={() => {
          setActiveVideo(activeVideo === "members" ? "" : "members");
        }}
        description="invite friends to join"
        buttonClass={`${styles.cardAnimation4} hover:bg-[#fafffa]`}
        positionClass="absolute left-2 sm:left-0 bottom-[-88px] z-50"
      />
      {activeVideo && (
        <div className="absolute bottom-0 left-0 right-0 top-0 z-50 m-auto flex h-fit w-[90%] flex-col items-center gap-2 rounded-md border shadow-lg">
          <video
            key={activeVideo}
            className="rounded-md shadow-lg"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={`/video/${activeVideo}.webm`} type="video/webm" />
            <source src={`/video/${activeVideo}.mp4`} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
};

const DividerSmall = () => (
  <div className="bg-accent-gold m-auto my-2 rounded-md p-2 sm:my-4 sm:p-4">
    <div className="bg-accent-red rounded-md p-2 sm:p-4">
      <div className="bg-accent-blue rounded-md p-1 sm:p-2"></div>
    </div>
  </div>
);

const Feature = (props: {
  name: string;
  description: string;
  buttonClass: string;
  positionClass: string;
  setActiveVideo: () => void;
}) => (
  <div className={props.positionClass}>
    <button
      className={`${props.buttonClass} w-56 rounded-md border bg-white p-2 text-sm`}
      onClick={() => props.setActiveVideo()}
    >
      <p>
        <strong>{props.name}</strong>
      </p>
      <p>{props.description}</p>
    </button>
  </div>
);
