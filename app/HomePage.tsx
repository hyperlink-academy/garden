"use client";
import { ButtonLink, ButtonPrimary, ButtonSecondary } from "components/Buttons";
import {
  BackToHome,
  BellSmall,
  CalendarMedium,
  CallSmall,
  ChatSmall,
  GoToPageLined,
  MemberAdd,
  Rooms,
  SearchOrCommand,
  SectionLinkedCard,
} from "components/Icons";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoginOrSignupModal } from "components/LoginModal";
import { Divider } from "components/Layout";
import { useState } from "react";
import { Modal } from "components/Modal";
import { useIsMobile } from "hooks/utils";

export function HomePage() {
  let [loginOrSignupState, setLoginOrSignupState] =
    LoginOrSignupModal.useState("closed");
  let [subscribeModal, setSubscribeModal] = useState(false);

  let isMobile = useIsMobile();
  let { session } = useAuth();
  let router = useRouter();

  return (
    <div className="relative">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex items-center justify-between px-2 pb-1 pt-2 sm:px-4">
          {/* notes */}
          <div className="flex gap-2">
            <a
              href="https://notes.hyperlink.academy"
              className="mx-auto text-accent-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <strong>writing</strong>
              </span>
            </a>
            <span className="text-grey-80">|</span>
            <Link
              href="/docs"
              className="mx-auto flex items-center justify-center gap-2 text-accent-blue"
            >
              <span>
                <strong>docs</strong>
              </span>
            </Link>
          </div>
          {/* login / signup links */}
          <div className="flex flex-row gap-2 self-center">
            {!session?.loggedIn ? (
              <>
                <ButtonSecondary
                  content="log in"
                  onClick={() => setLoginOrSignupState("login")}
                />
                <ButtonPrimary
                  content="sign up"
                  onClick={() => setLoginOrSignupState("signup")}
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
                className="mx-auto flex items-center justify-center gap-2 hover:text-accent-blue"
              >
                <BackToHome />
                <span>
                  <strong>visit my homepage</strong>
                </span>
              </Link>
            ) : (
              <Link
                href={`/setup`}
                className="mx-auto flex items-center justify-center gap-2 hover:text-accent-blue"
              >
                <BackToHome />
                <span>
                  <strong>finish account setup!</strong>
                </span>
              </Link>
            )}
          </div>
        </div>
        <Divider />
      </div>

      {/* landing page wrapper  */}
      <div className="landing">
        {/* main content - inner wrapper */}
        <div className="m-auto  flex flex-col">
          {/* title: hyperlink academy */}
          <div className="w-screen bg-bg-blue pb-32 pt-8 sm:pt-12 ">
            <div className="relative mx-auto flex w-fit flex-col gap-8">
              {/* title and tagline */}
              <div className="pl-8 pr-4 sm:pl-24">
                <Image
                  src="/img/landing/hero.png"
                  alt="hyperlink academy logo"
                  width={800}
                  height={400}
                />
              </div>
              <div className="mx-4 -mt-[120px] flex flex-col gap-3 sm:mx-8">
                <h1 className=" italic text-accent-blue">
                  a set of tools for <br /> collaborative creative projects
                </h1>
                <div className="flex w-full items-center gap-4">
                  <ButtonPrimary
                    className="!px-2 !py-1 !text-lg sm:!px-4 sm:!py-1 sm:!text-xl"
                    content="Sign Up!"
                    onClick={() => setLoginOrSignupState("signup")}
                  />
                  <p className="text-lg text-grey-55">
                    or get the{" "}
                    <span>
                      <button
                        onClick={() => setSubscribeModal(true)}
                        className="text-accent-blue hover:underline"
                      >
                        newsletter
                      </button>
                      <SubscribeModal
                        open={subscribeModal}
                        onClose={() => setSubscribeModal(false)}
                      />
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* internet clubs */}
          <div className="mx-auto">
            <div className="relative m-[8px] mx-4 -mt-12 flex max-w-3xl flex-col gap-8 border border-grey-80 bg-white p-4 pt-6 sm:mx-8 sm:p-8 sm:pt-8 sm:text-lg">
              <div className="absolute -top-[16px] right-[8px] w-max rotate-3 rounded-md bg-accent-red p-1 text-sm font-bold text-white sm:-right-[32px] sm:p-2 sm:text-base">
                in progress!
              </div>
              <div
                className={`flex max-w-2xl flex-col gap-3 text-center text-grey-35`}
              >
                <h2 className="text-grey-15">Internet Clubs</h2>

                <p>
                  We&apos;re playing with{" "}
                  <strong>a new kind of internet club</strong> — communities of
                  practice where we make and explore things together.
                </p>
                <p>
                  In each club we work async in Spaces, explore and chat about
                  each other&apos;s work, and share updates with a group digest.
                </p>
                <a
                  className="flex items-center justify-center gap-1 text-sm text-accent-blue hover:underline sm:text-base"
                  href={"https://notes.hyperlink.academy/note/internet-clubs"}
                >
                  read more about the clubs
                  <GoToPageLined />
                </a>
              </div>

              <p className="text-center font-bold italic sm:text-lg">
                ✨ explore our current clubs! ✨
              </p>
              <div className="mb-6 flex w-full flex-col-reverse  gap-9 pr-8 md:flex-row-reverse">
                <StudioItem
                  name="Pedagogical Parents"
                  description="reading books about learning"
                  image="/img/landing/pedagogical.png"
                  alt="diptych of book covers, on the front of an abstract blue building"
                  url="https://hyperlink.academy/studio/4lO7UZsrSbMZUN7zEt7I4q"
                />
                <StudioItem
                  name="Internet Homesteading"
                  description="building personal websites"
                  image="/img/landing/internet.png"
                  alt="pixel art of tree, path, and home on a hilltop, on the front of an abstract red building"
                  url="https://hyperlink.academy/studio/46boxeFl9XacS39o1hwpJ8"
                />
                <StudioItem
                  name="Handmade March"
                  description="making things by hand every day"
                  image="/img/landing/handmade.png"
                  alt="a handmade pufferfish stamp, on the front of an abstract golden building"
                  url="https://hyperlink.academy/studio/2QUkzDt56DYB7B0RS10mTL"
                />
              </div>

              <div
                style={{}}
                className="my-4 flex flex-col items-center gap-4 bg-[url('../public/img/landing/funAccent.svg')] bg-contain bg-center bg-no-repeat p-10 text-center"
              >
                <div className="flex flex-col gap-0 text-grey-35">
                  <h4>Want to start a club of your own?</h4>
                  <p className="text-base text-grey-55">
                    We&apos;ll help with ideas, setup, and tech support!
                  </p>
                </div>

                <Link
                  href="https://hyperlink.academy/forms/propose-club"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ButtonSecondary content="Propose a Club" />
                </Link>
              </div>
            </div>
          </div>

          {/* what is hyperlink */}
          <div className="whatIsHyperlink mt-[80px] sm:mt-[120px]">
            <div
              className={`mx-auto flex max-w-[800px] flex-col gap-3 px-4 text-center sm:text-lg`}
            >
              <p className="text-lg font-bold sm:text-xl">
                Hyperlink is a place for ambitious creative projects with
                friends, partners, and co-conspirators.
              </p>
              <p className="text-grey-35">
                Use it as a shared notebook, a place for conversation, and a
                tool for coordination. Hyperlink is for creating, collecting,
                and sharing the work and artifacts of a collective.
              </p>
            </div>
            <div className="relative mx-auto mt-16 w-max">
              <Image
                src="/img/landing/studios.png"
                alt="a cute little drawing of some funky buildings in a neighborhood"
                width={isMobile ? 300 : 600}
                height={0}
                className={isMobile ? "pl-8" : ""}
              />
              <Image
                src="/img/landing/arrow.png"
                alt="an arrow leading from one of the earlier funky buildings to a diagram of what's inside it"
                width={isMobile ? 80 : 100}
                height={100}
                className="absolute -bottom-[125px] right-[125px] sm:right-[250px]"
              />
              <div className="absolute -top-12 right-[0px] w-[200px] text-center sm:-top-[16px] sm:right-[50px] sm:w-[320px]">
                <h4 className="text-base text-grey-35 sm:text-lg">Studios!</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  homes and galleries for groups working together — like clubs,
                  cohorts, or teams
                </p>
              </div>
            </div>

            <div className="relative mx-auto mt-12 w-max  pr-[200px] sm:pr-[340px]">
              <Image
                src="/img/landing/spaces.png"
                alt="a 0-90 axonometric drawing of a building with three floors, a bunch of rooms and overflowing creative work inside"
                width={400}
                height={100}
              />
              <div className="absolute right-[85px] top-[280px] w-[180px] text-left sm:w-[240px] ">
                <h4 className="text-base text-grey-35 sm:text-lg">Spaces</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  workspaces — projects, gatherings, or explorations
                </p>
              </div>
              <div className="absolute right-[85px] top-[420px] w-[180px]  text-left sm:w-[240px]">
                <h4 className="text-base text-grey-35 sm:text-lg">Rooms</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  to organize your work — collections, canvases, and chat
                </p>
              </div>
              <div className="absolute right-[85px] top-[525px] w-[180px] text-left sm:w-[240px]">
                <h4 className="text-base text-grey-35 sm:text-lg">Cards</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  the work itself — documents, text, images, comments & more
                </p>
              </div>
            </div>

            <div className="features mx-auto mt-[64px] max-w-4xl px-2">
              <h4 className="mb-4 text-center">
                And other tools for getting it done
              </h4>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                <FeatureListItem
                  name="Invites"
                  description="Invite people to join Spaces and Studios"
                  icon={<MemberAdd />}
                />
                <FeatureListItem
                  name="Discussion"
                  description="Global chat rooms; comments on any card"
                  icon={<ChatSmall />}
                />
                <FeatureListItem
                  name="Calendar"
                  description="Add dates to cards; view things past and future"
                  icon={<CalendarMedium />}
                />
                <FeatureListItem
                  name="Links"
                  description="Attach cards or link them inline, wiki-style"
                  // icon={<LinkSmall />}
                  icon={<SectionLinkedCard />}
                />
                <FeatureListItem
                  name="Backlinks"
                  description="See anywhere a card is referenced in a Space"
                  icon={<SearchOrCommand />}
                />
                <FeatureListItem
                  name="Audio Calls"
                  description="Work and talk together directly in a Space"
                  icon={<CallSmall />}
                />
                <FeatureListItem
                  name="Multiplayer Presence"
                  description="See when others are in a Space — and where"
                  icon={<Rooms />}
                />
                <FeatureListItem
                  name="Push Notifications"
                  description="When you add the web app on mobile!"
                  icon={<BellSmall />}
                />
              </div>
            </div>
          </div>
          <div className="mx-auto py-8 text-accent-gold sm:py-12">
            <FancyDivider />
          </div>
          {/* get started! */}
          <div className="m-auto flex flex-col text-grey-35">
            <div className="flex flex-col items-center px-6 py-3 text-center sm:p-8">
              <div className="my-4 -rotate-3 rounded-lg bg-accent-gold px-6 py-10 sm:px-16">
                <div className="rotate-3">
                  <div className="flex flex-col items-center gap-4">
                    {/* login / signup links */}
                    {!session?.loggedIn ? (
                      <>
                        <h2>Let&apos;s get started!</h2>
                        <ButtonPrimary
                          content="Sign up for Hyperlink!"
                          onClick={() => setLoginOrSignupState("signup")}
                        />
                      </>
                    ) : session.session?.username ? (
                      <>
                        <h2>Let&apos;s get started!</h2>
                        <p>You&apos;re already logged in ☀️</p>
                        <Link href={`/s/${session.session.username}`}>
                          <ButtonPrimary
                            content="visit my homepage"
                            icon={<BackToHome />}
                          />
                        </Link>
                      </>
                    ) : (
                      <>
                        <h2>Let&apos;s get started!</h2>
                        <p>You&apos;re already logged in ☀️</p>
                        <Link href={`/setup`}>
                          <ButtonPrimary
                            content="finish account setup"
                            icon={<BackToHome />}
                          />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* newsletter form */}
            <div className="m-auto flex max-w-lg flex-col gap-4 rounded-md bg-background px-4 pb-12 text-center">
              <h3>Or, drop your email & stay in the loop</h3>
              <p className="text-sm">
                We send updates 1–2x / month about new features & experiments;
                we&apos;ll never spam or share your email
              </p>
              <div className="mx-auto flex gap-2">
                <form
                  action="https://buttondown.email/api/emails/embed-subscribe/hyperlink"
                  method="post"
                  target="popupwindow"
                  onSubmit={async () => {
                    window.open(
                      "https://buttondown.email/hyperlink",
                      "popupwindow"
                    );
                  }}
                  className="embeddable-buttondown-form  flex h-9 gap-1"
                >
                  <input
                    type="email"
                    name="email"
                    id="bd-email"
                    placeholder="email"
                    required
                  />
                  <ButtonSecondary content="Subscribe!" type="submit" />
                </form>
              </div>
            </div>
          </div>

          {/* end main content wrapper  */}
        </div>

        {/* END LANDING WRAPPER */}
      </div>

      {/* FOOTER */}

      <Divider />

      <div className="flex  flex-row justify-between gap-4">
        <div className="flex flex-col gap-1 px-4 py-2 text-sm text-grey-55 sm:flex-row sm:gap-2">
          <Link href="/privacy" className=" w-max hover:text-accent-blue">
            privacy policy
          </Link>{" "}
          {!isMobile ? <span className="text-grey-80">|</span> : null}
          <Link href="/terms" className="hover:text-accent-blue">
            terms
          </Link>
        </div>
        <div className="px-4 py-2 text-right text-sm text-grey-55">
          <p className="">
            Questions? {isMobile ? <br /> : null}
            <a
              href="mailto:contact@hyperlink.academy"
              className="text-accent-blue hover:text-grey-55"
            >
              Send us a note
            </a>{" "}
            ✨🌱
          </p>
        </div>
      </div>
    </div>
  );
}

const StudioItem = (props: {
  name: string;
  description: string;
  image: string;
  alt: string;
  url: string;
}) => {
  return (
    <div className="relative flex basis-1/3 flex-col rounded-md border border-grey-80 bg-white p-3 pb-2">
      <div className="flex h-full flex-col">
        <p className="font-bold text-grey-35">{props.name}</p>
        <p className="grow pb-2 text-sm italic text-grey-55">
          {props.description}
        </p>
      </div>

      <Link
        href={props.url}
        className="flex items-center gap-2 text-sm text-accent-blue"
      >
        <ButtonLink content="browse" />
        <GoToPageLined />
      </Link>
      <Image
        src={props.image}
        alt={props.alt}
        width={132}
        height={160}
        className="absolute -bottom-[24px] -right-[32px]"
      />
    </div>
  );
};

const FeatureListItem = (props: {
  name: string;
  description: string;
  icon: React.ReactElement;
}) => {
  return (
    <div className=" flex w-48 flex-col items-center gap-2 p-2  text-center text-grey-35 sm:p-4">
      {props.icon}
      <div>
        <p className="text-grey-35">
          <strong>{props.name}</strong>
        </p>
        <p className="text-grey-55">{props.description}</p>
      </div>
    </div>
  );
};

const SubscribeModal = (props: { open: boolean; onClose: () => void }) => {
  return (
    <Modal
      open={props.open}
      onClose={() => props.onClose()}
      header="Subscribe to the Newsletter"
    >
      <p className="font-bold">
        Drop your email, we&apos;ll keep you in the loop!
      </p>
      <p>
        We email 1-2 a month about new features, experiments, and plans.
        We&apos;ll never spam or share your email
      </p>
      <form
        action="https://buttondown.email/api/emails/embed-subscribe/hyperlink"
        method="post"
        target="popupwindow"
        onSubmit={async () => {
          window.open("https://buttondown.email/hyperlink", "popupwindow");
        }}
        className="embeddable-buttondown-form  flex h-9 w-full gap-2"
      >
        <input
          className="grow"
          type="email"
          name="email"
          id="bd-email"
          placeholder="email"
          required
        />
        <ButtonPrimary content="Subscribe!" type="submit" />
      </form>
    </Modal>
  );
};

const FancyDivider = () => {
  let isMobile = useIsMobile();
  if (isMobile) {
    return (
      <svg
        width="219"
        height="30"
        viewBox="0 0 219 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M215.001 4C205.895 4 197.463 14.692 197.463 14.692C197.463 14.692 189.03 25.3839 179.924 25.3839C170.819 25.3839 162.386 14.692 162.386 14.692C162.386 14.692 153.953 4.00001 144.848 4.00001C135.742 4.00001 127.309 14.692 127.309 14.692M4.53906 4.00001C13.6446 4.00001 22.0773 14.692 22.0773 14.692C22.0773 14.692 30.5101 25.3839 39.6156 25.3839C48.7211 25.3839 57.1539 14.692 57.1539 14.692C57.1539 14.692 65.5866 4 74.6921 4C83.7976 4 92.2304 14.692 92.2304 14.692C92.2304 14.692 100.664 25.3839 109.769 25.3839C118.875 25.3839 127.308 14.6919 127.308 14.6919"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
        />
      </svg>
    );
  } else
    return (
      <svg
        width="560"
        height="32"
        viewBox="0 0 560 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 16C4 16 13.4644 4.00001 23.6839 4.00001C33.9034 4.00001 43.3678 16 43.3678 16C43.3678 16 52.8322 28 63.0517 28C73.2712 28 82.7356 16 82.7356 16C82.7356 16 92.2 4 102.419 4C112.639 4 122.103 16 122.103 16C122.103 16 131.569 28 141.788 28C152.007 28 161.472 16 161.472 16M318.948 16C318.948 16 328.413 4.00001 338.632 4.00001C348.851 4.00001 358.316 16 358.316 16C358.316 16 367.78 28 378 28C388.219 28 397.684 16 397.684 16C397.684 16 407.148 4 417.368 4C427.587 4 437.051 16 437.051 16C437.051 16 446.517 28 456.736 28C466.956 28 476.42 16 476.42 16M161.474 16C161.474 16 170.938 4.00001 181.158 4.00001C191.377 4.00001 200.842 16 200.842 16C200.842 16 210.306 28 220.526 28C230.745 28 240.21 16 240.21 16C240.21 16 249.674 4 259.894 4C270.113 4 279.577 16 279.577 16C279.577 16 289.043 28 299.262 28C309.482 28 318.946 16 318.946 16M476.422 16C476.422 16 485.887 4.00001 496.106 4.00001C506.326 4.00001 515.79 16 515.79 16C515.79 16 525.254 28 535.474 28C545.693 28 555.158 16 555.158 16"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
        />
      </svg>
    );
};
