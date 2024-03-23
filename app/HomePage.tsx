"use client";
import { ButtonLink, ButtonPrimary } from "components/Buttons";
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
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoginOrSignupModal } from "components/LoginModal";
import { Divider } from "components/Layout";
import studioImgHandmadeMarch from "public/landing/studio-handmade-march.png";
import studioImgInternetHomesteading from "public/landing/studio-internet-homesteading.png";
import studioImgPedagogicalParents from "public/landing/studio-pedagogical-parents.png";

export function HomePage() {
  let [loginOrSignupState, setLoginOrSignupState] =
    LoginOrSignupModal.useState("closed");

  let { session } = useAuth();
  let router = useRouter();

  return (
    <>
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex justify-between px-4 py-2">
          {/* notes */}
          <div className="flex gap-2">
            <a
              href="https://notes.hyperlink.academy"
              className="mx-auto flex items-center justify-center gap-2 hover:text-accent-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <strong>notes</strong> <em>(our blog)</em>
              </span>
            </a>
            <span className="text-grey-80">|</span>
            <Link
              href="/docs"
              className="mx-auto flex items-center justify-center gap-2 hover:text-accent-blue"
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
          <div className="w-screen bg-bg-blue pb-32 pt-12 ">
            <div className="relative mx-auto flex w-fit flex-col gap-8">
              {/* title and tagline */}
              <div className="pl-20">
                <Image
                  src="/img/landing/hero.png"
                  alt="hyperlink academy logo"
                  width={800}
                  height={400}
                />
              </div>
              <h1 className="absolute top-[520px] gap-4 italic text-accent-blue">
                a set of tools for <br /> collaborative creative projects
              </h1>
            </div>
          </div>

          {/* internet clubs */}
          <div className="relative m-[8px] mx-auto -mt-12 flex max-w-3xl flex-col gap-8 border border-grey-80 bg-white p-8 text-lg">
            <div className="absolute -right-[32px] -top-[16px] w-max rotate-3 rounded-md bg-accent-red p-2 font-bold text-white">
              in progress!
            </div>
            <div className={`flex max-w-prose flex-col gap-3`}>
              <h2 className="text-center">Internet Clubs</h2>

              <p className="text-center">
                We&apos;re playing with{" "}
                <strong>a new kind of internet club</strong> — communities of
                practice where we make and explore things together.
              </p>
              <p className="text-center">
                In each club we work async in Spaces, explore and chat about
                each other&apos;s work, and share updates with a group digest.
              </p>
            </div>

            <p className="text-center text-lg font-bold italic">
              ✨ explore our current clubs! ✨
            </p>
            <div className="grid w-full grid-cols-3 gap-4">
              <StudioItem
                name="Handmade March"
                description="making things by hand every day"
                image={studioImgHandmadeMarch}
                alt="a handmade pufferfish stamp, on the front of an abstract golden building"
                url="https://hyperlink.academy/studio/2QUkzDt56DYB7B0RS10mTL"
              />
              <StudioItem
                name="Internet Homesteading"
                description="building personal websites"
                image={studioImgInternetHomesteading}
                alt="pixel art of tree, path, and home on a hilltop, on the front of an abstract red building"
                url="https://hyperlink.academy/studio/46boxeFl9XacS39o1hwpJ8"
              />
              <StudioItem
                name="Pedagogical Parents"
                description="reading books about learning"
                image={studioImgPedagogicalParents}
                alt="diptych of book covers, on the front of an abstract blue building"
                url="https://hyperlink.academy/studio/4lO7UZsrSbMZUN7zEt7I4q"
              />
            </div>

            <div className={`flex flex-col items-center gap-3 text-center`}>
              <h3>Want to start a club of your own?</h3>
              <p>We&apos;ll help with ideas, setup, and tech support!</p>
              <Link
                href="https://hyperlink.academy/forms/propose-club"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ButtonPrimary content="Propose a Club" />
              </Link>
            </div>
          </div>

          {/* what is hyperlink */}
          <div className="whatIsHyperlink mt-[120px]">
            <div
              className={`mx-auto flex max-w-prose flex-col gap-3 text-center text-lg`}
            >
              <p className="text-xl font-bold">
                Hyperlink is a place to do ambitious creative projects with
                friends, partners, and co-conspirators.
              </p>
              <p>
                Use it as a shared notebook, a place for conversation, and a
                tool for coordination. Hyperlink is for creating, collecting,
                and sharing the work and artifacts of a collective.
              </p>
            </div>
            <div className="relative mx-auto mt-16 w-max">
              <Image
                src="/img/landing/studios.png"
                alt="a cute little drawing of some funky buildings in a neighborhood"
                width={600}
                height={400}
              />
              <Image
                src="/img/landing/arrow.png"
                alt="a cute little drawing of some funky buildings in a neighborhood"
                width={100}
                height={100}
                className="absolute -bottom-[125px] right-[250px]"
              />
              <div className="absolute -top-[16px] right-[50px] w-[320px] text-center">
                <h4 className="text-grey-35">Studios!</h4>
                <p className="text-sm text-grey-55">
                  homes for groups working together — like clubs, cohorts, or
                  teams
                </p>
              </div>
            </div>

            <div className="relative mx-auto mt-12 w-fit pr-[340px]">
              <Image
                src="/img/landing/spaces.png"
                alt="a cute little drawing of some funky buildings in a neighborhood"
                width={300}
                height={100}
              />
              <div className="absolute right-[80px] top-[250px] w-[240px] text-center">
                <h4 className="text-grey-35">Spaces</h4>
                <p className="text-sm text-grey-55">
                  homes for groups working together — like clubs, cohorts, or
                  teams
                </p>
              </div>
              <div className="absolute right-[80px] top-[350px] w-[240px] text-center">
                <h4 className="text-grey-35">Rooms</h4>
                <p className="text-sm text-grey-55">
                  homes for groups working together — like clubs, cohorts, or
                  teams
                </p>
              </div>
              <div className="absolute right-[80px] top-[450px] w-[240px] text-center">
                <h4 className="text-grey-35">Cards</h4>
                <p className="text-sm text-grey-55">
                  homes for groups working together — like clubs, cohorts, or
                  teams
                </p>
              </div>
            </div>

            <div>
              <div className="py-8">
                {/* <div className="bg-bg-blue p-4">
                  <p className="text-lg">
                    <strong>studios</strong>
                  </p>
                  <p>
                    homes for groups working together — like clubs, cohorts, or
                    teams
                  </p>
                  <div className="m-4 w-2/3 bg-bg-gold p-4">
                    <p className="text-lg">
                      <strong>spaces</strong>
                    </p>
                    <p>
                      collaborative workspaces — for projects, gatherings, or
                      explorations
                    </p>
                    <div className="m-4 w-2/3 bg-bg-red p-4">
                      <p className="text-lg">
                        <strong>rooms</strong>
                      </p>
                      <p>
                        organize your work — collections, canvases, and chat
                        rooms
                      </p>
                      <div className="m-4 w-2/3 bg-white p-4">
                        <p className="text-lg">
                          <strong>cards</strong>
                        </p>
                        <p>
                          modular documents — collect text, images, chat & more
                        </p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
              <div className="features mx-auto max-w-4xl">
                <h4 className="mb-8 text-center">
                  and tools to help you get it done...
                </h4>
                <div className="flex flex-wrap justify-center gap-8">
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
          </div>

          {/* get started! */}
          <div className="m-auto flex flex-col gap-8">
            <div className="flex flex-col items-center p-8 text-center">
              <div className="my-4 -rotate-3 bg-accent-gold px-16 py-16">
                <div className="rotate-3">
                  <div className="flex flex-col items-center gap-4">
                    {/* login / signup links */}
                    {!session?.loggedIn ? (
                      <>
                        <h2>Let&apos;s get started!</h2>
                        <p>Join to make Spaces & Studios</p>
                        <p>⬇️ ↓ ⬇ ⤵️ ↯ ⏬ ⇣</p>
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
            <div className="m-auto flex max-w-lg flex-col gap-4 rounded-md bg-background p-8 text-center">
              <h3>Or, drop your email & stay in the loop</h3>
              <p className="text-sm">
                We send updates 1–2x / month about new features & experiments;
                we&apos;ll never spam or share your email
              </p>
              <div className="m-auto flex w-fit gap-2">
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
                  className="embeddable-buttondown-form m-auto flex w-fit gap-2"
                >
                  <input
                    type="email"
                    name="email"
                    id="bd-email"
                    placeholder="email"
                    required
                  />
                  <div className="grid justify-items-end text-right">
                    <ButtonPrimary content="Subscribe!" type="submit" />
                  </div>
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

      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-row gap-2 px-4 py-2 text-sm text-grey-55">
          <Link href="/privacy" className="hover:text-accent-blue">
            privacy policy
          </Link>{" "}
          <span className="text-grey-80">|</span>{" "}
          <Link href="/terms" className="hover:text-accent-blue">
            terms
          </Link>
        </div>
        <div className="px-4 py-2 text-sm text-grey-55">
          <p className="">
            Questions?{" "}
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
    </>
  );
}

const StudioItem = (props: {
  name: string;
  description: string;
  image: StaticImageData;
  alt: string;
  url: string;
}) => {
  return (
    // <Link href={props.url} className="">
    // DISABLED: transition-all hover:scale-[1.02] hover:shadow-md
    <div className="relative flex flex-col rounded-md border border-grey-80 bg-white p-3">
      <div className="flex flex-col">
        <h4>{props.name}</h4>
        <p className="text-sm italic">{props.description}</p>
      </div>
      <Image
        src={props.image}
        alt={props.alt}
        width={160}
        className="absolute -bottom-[24px] -left-[32px]"
      />
      <Link
        href={props.url}
        className="flex items-center gap-2 text-accent-blue"
      >
        <ButtonLink content="check it out" />
        <GoToPageLined />
      </Link>
    </div>
    // </Link>
  );
};

const FeatureListItem = (props: {
  name: string;
  description: string;
  icon: React.ReactElement;
}) => {
  return (
    <div className=" flex w-48 flex-col items-center  p-4 text-center">
      {props.icon}
      <p>
        <strong>{props.name}</strong>
      </p>
      <p>{props.description}</p>
    </div>
  );
};
