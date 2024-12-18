"use client";
import styles from "styles/Landing.module.css";
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
import { createPortal } from "react-dom";

export function HomePage() {
  let [loginOrSignupState, setLoginOrSignupState] =
    LoginOrSignupModal.useState("closed");
  let [subscribeModal, setSubscribeModal] = useState(false);

  let isMobile = useIsMobile();
  let { session } = useAuth();
  let router = useRouter();

  return (
    <div className="homepageWrapper relative overflow-x-clip pwa-margin pwa-margin-bottom">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-background pwa-margin">
        <div className="flex items-center justify-between px-2 py-2 sm:px-4">
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
                  <strong>my homepage</strong>
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
                  priority
                />
              </div>
              <div className="mx-4 -mt-[120px] flex flex-col gap-8 sm:mx-8">
                <h1 className="text-xl sm:text-2xl italic text-accent-blue mt-16 sm:mt-0">
                  <span>a place for</span>
                  <br />
                  <span className="ml-2 sm:ml-4">collaborative</span>
                  <br />
                  <span className="ml-4 sm:ml-16">creative</span>
                  <br />
                  <span className="ml-8 sm:ml-32">learning</span>
                </h1>
                <div className="flex w-full items-center gap-4 mx-auto place-content-center">
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
            <div className="relative m-2 mx-4 -mt-12 flex max-w-3xl flex-col gap-8 border border-grey-80 bg-white p-4 pt-6 sm:mx-8 sm:p-8 sm:pt-8 sm:text-lg rounded-md">
              <div className="absolute -top-[16px] right-[8px] w-max rotate-3 rounded-md bg-accent-red p-1 text-sm font-bold text-white sm:-right-[32px] sm:p-2 sm:text-base">
                current project!
              </div>
              <div className="flex max-w-2xl flex-col gap-4 text-grey-35">
                <h2 className="text-center">
                  Hyperlink is building a new app for making{" "}
                  <div className="inline-block italic">
                    <span className="text-[#cc0d96]">d</span>
                    <span className="text-[#0093ce]">e</span>
                    <span className="text-[#e24c00]">l</span>
                    <span className="text-[#009c48]">i</span>
                    <span className="text-[#e09f00]">g</span>
                    <span className="text-[#e93d3d]">h</span>
                    <span className="text-[#3d6fe0]">t</span>
                    <span className="text-[#a93bd3]">f</span>
                    <span className="text-[#0aa17c]">u</span>
                    <span className="text-[#ff671a]">l</span>
                  </div>{" "}
                  <span className="underline decoration-wavy decoration-accent-gold decoration-2">
                    documents
                  </span>{" "}
                  —{" "}
                  <a
                    target="_blank"
                    href="https://leaflet.pub"
                    className="text-accent-green hover:underline"
                  >
                    Leaflet
                  </a>
                  .
                </h2>

                <p>
                  It's a lightweight collaborative publishing tool for quick
                  tiny docs that can grow into rich creative surfaces ✨🌱
                </p>
                <ul>
                  <li>Like Google Docs…but faster, prettier, more fun</li>
                  <li>Like Notion…but cozy, customizable, easier to share</li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex flex-col gap-4">
                    <p>
                      With rich text, images, nested pages, lists, link
                      previews, custom themes…
                    </p>
                    <p>
                      From shared lists to love letters, poems to project notes,
                      syllabi to scrapbooks, wikis & lists & collections & more.
                    </p>
                    <p>
                      Try at{" "}
                      <a
                        target="_blank"
                        href="https://leaflet.pub"
                        className="text-accent-green hover:underline"
                      >
                        leaflet.pub
                      </a>{" "}
                      — no account needed!
                    </p>
                    <p>Drop your email for Leaflet updates 🍃</p>
                  </div>
                  <Image
                    src="/img/landing/home-gold-md-1.jpg"
                    alt="grid of leaflet docs"
                    width={256}
                    height={256}
                    priority
                    className="self-center rotate-3 p-4 rounded-[20px]"
                  />
                </div>

                <SubscribeFormLeaflet />
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
              {!isMobile ? (
                <>
                  {/* rabbitholeathon */}
                  <a
                    target="_blank"
                    href="https://hyperlink.academy/studio/3949e8c5-1d77-46f0-bb58-37756d4510f7"
                    className="CONE absolute left-[25px] top-[40px] h-[270px] w-[100px]"
                  />
                  {/* spec-fi sandwich club */}
                  <a
                    target="_blank"
                    href="https://hyperlink.academy/studio/2dcc1b60-9c0a-4029-9f38-8593a0d582a6"
                    className="HOUSE absolute left-[190px] top-[270px] h-[145px] w-[132px]"
                  />
                  {/* feb 2024 links */}
                  <a
                    target="_blank"
                    href="https://hyperlink.academy/studio/6ejN4eHGFWBB3zwhvwlMQG"
                    className="ZIG absolute left-[320px] top-[160px] h-[140px] w-[132px] rotate-[33deg]"
                  />
                </>
              ) : (
                <>
                  {/* rabbitholeathon */}
                  <a
                    target="_blank"
                    href="https://hyperlink.academy/studio/3949e8c5-1d77-46f0-bb58-37756d4510f7"
                    className="CONE absolute left-[45px] top-[18px] h-[120px] w-[50px]"
                  />
                  {/* spec-fi sandwich club */}
                  <a
                    target="_blank"
                    href="https://hyperlink.academy/studio/2dcc1b60-9c0a-4029-9f38-8593a0d582a6"
                    className="HOUSE absolute left-[118px] top-[120px] h-[65px] w-[58px]"
                  />
                  {/* feb 2024 links */}
                  <a
                    target="_blank"
                    href="https://hyperlink.academy/studio/6ejN4eHGFWBB3zwhvwlMQG"
                    className="ZIG absolute left-[175px] top-[70px] h-[60px] w-[60px] rotate-[33deg]"
                  />
                </>
              )}

              <Image
                src="/img/landing/studios.png"
                alt="a cute little drawing of some funky buildings in a neighborhood"
                width={isMobile ? 320 : 600}
                height={0}
                className={isMobile ? "pl-8" : ""}
              />
              <Image
                src="/img/landing/arrow.png"
                alt="an arrow leading from one of the earlier funky buildings to a diagram of what's inside it"
                width={isMobile ? 70 : 100}
                height={100}
                className="absolute -bottom-[125px] right-[80px] sm:right-[250px]"
              />
              <div className="absolute -top-12 right-[0px] w-[200px] text-center sm:-top-[16px] sm:right-[50px] sm:w-[320px]">
                <h4 className="text-base text-grey-35 sm:text-lg">Studios</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  homes and galleries for groups working together — like clubs,
                  cohorts, or teams
                </p>
              </div>
            </div>

            <div className="relative mx-auto mt-12 w-max  pr-[232px] sm:pr-[340px]">
              <Image
                src="/img/landing/spaces.png"
                alt="a 0-90 axonometric drawing of a building with three floors, a bunch of rooms and overflowing creative work inside"
                width={isMobile ? 200 : 400}
                height={100}
              />
              <div className="absolute right-[60px] top-[100px] w-[160px] text-left sm:right-[85px] sm:top-[280px] sm:w-[240px] ">
                <h4 className="text-sm text-grey-35 sm:text-lg">Spaces</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  workspaces — projects, gatherings, or explorations
                </p>
              </div>
              <div className="absolute right-[60px] top-[180px] w-[160px] text-left sm:right-[85px] sm:top-[420px] sm:w-[240px]">
                <h4 className=" text-sm text-grey-35 sm:text-lg">Rooms</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  to organize your work — collections, canvases, and chat
                </p>
              </div>
              <div className="absolute right-[60px] top-[260px] w-[160px] text-left sm:right-[85px] sm:top-[525px] sm:w-[240px] ">
                <h4 className="text-sm text-grey-35 sm:text-lg">Cards</h4>
                <p className="text-xs text-grey-55 sm:text-sm">
                  the work itself — documents, text, images, comments & more
                </p>
              </div>
            </div>

            <div className="features mx-auto mt-[80px] max-w-4xl px-2 sm:mt-[64px]">
              <h4 className="mb-4 text-center">
                …and plenty of tools for getting it done!
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
                            content="my homepage"
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
              <SubscribeFormHyperlink />
            </div>
          </div>

          {/* end main content wrapper  */}
        </div>

        {/* END LANDING WRAPPER */}
      </div>

      {/* FOOTER */}

      <Divider />

      <div className="flex flex-row justify-between gap-4 pwa-margin-bottom">
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
        className="flex items-center gap-2 text-sm text-accent-blue hover:underline"
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
    <div className="flex w-64 flex-col items-center gap-2 p-2 text-center text-grey-35 sm:p-4">
      {props.icon}
      <div className="flex flex-col gap-1">
        <p className="text-grey-35">
          <strong>{props.name}</strong>
        </p>
        <p className="text-grey-55">{props.description}</p>
      </div>
    </div>
  );
};

const SubscribeFormHyperlink = () => {
  return (
    <div className="mx-auto flex gap-2">
      <form
        action="https://buttondown.com/api/emails/embed-subscribe/hyperlink"
        method="post"
        target="popupwindow"
        onSubmit={async () => {
          window.open("https://buttondown.com/hyperlink", "popupwindow");
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
  );
};

const SubscribeFormLeaflet = () => {
  return (
    <div className="mx-auto flex gap-2">
      <form
        action="https://buttondown.com/api/emails/embed-subscribe/leaflet"
        method="post"
        target="popupwindow"
        onSubmit={async () => {
          window.open("https://buttondown.com/leaflet", "popupwindow");
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
  );
};

const SubscribeModal = (props: { open: boolean; onClose: () => void }) => {
  if (!props.open) return null;
  return createPortal(
    <Modal
      open={props.open}
      onClose={() => props.onClose()}
      header="Subscribe to our Newsletter"
    >
      <p className="font-bold">
        Drop your email, we&apos;ll keep you in the loop!
      </p>
      <p>
        We send updates 1–2x / month about new features & experiments;
        we&apos;ll never spam or share your email
      </p>
      <form
        action="https://buttondown.com/api/emails/embed-subscribe/hyperlink"
        method="post"
        target="popupwindow"
        onSubmit={async () => {
          window.open("https://buttondown.com/hyperlink", "popupwindow");
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
    </Modal>,
    document.body
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
          strokeWidth="8"
          strokeLinecap="round"
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
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    );
};
