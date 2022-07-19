import { useAuth } from "hooks/useAuth";
import Head from "next/head";
import Link from "next/link";
import { LogInModal } from "components/LoginModal";
import { useState } from "react";
import { ButtonLink } from "components/Buttons";
import { ExitDoor } from "components/Icons";
import { Modal } from "components/Layout";
import { useRouter } from "next/router";
import { LoginForm } from "./login";

export default function IndexPage() {
  return (
    <>
      <Head>
        <title key="title">Hyperlink Academy</title>
      </Head>
      <div className="py-8 md:py-16 px-8 max-w-4xl flex-col gap-8 m-auto flex">
        {/* login */}
        {/* <LoginBar /> */}

        {/* title */}
        <div className="text-center">
          <h1 className="text-6xl	pb-8">Hyperlink Academy</h1>
          <p className="text-2xl ">
            Build shared spaces for lifelong learning.
          </p>
        </div>

        {/* login */}
        <LoginBox />

        {/* intro */}
        <div className="max-w-xl m-auto space-y-8">
          <p>
            🌱 First, we experimented with{" "}
            <a
              className="text-accent-blue"
              href="https://year-one.hyperlink.academy/courses"
            >
              courses
            </a>{" "}
            and{" "}
            <a
              className="text-accent-blue"
              href="https://year-one.hyperlink.academy/clubs"
            >
              clubs
            </a>
            .
          </p>
          <p>
            🌱 Next, we hopped into{" "}
            <a
              className="text-accent-blue"
              href="https://space.hyperlink.academy/"
            >
              hyperspace
            </a>{" "}
            and dug research rabbitholes.
          </p>
          <p>
            🌱 Now, we're making something new — a place to bring people into
            purpose-built spaces to create, learn, and collaborate.
          </p>
        </div>

        <Divider marginTop="mt-8 md:mt-16" marginBottom="mb-8 md:mb-0" />

        {/* doors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="place-self-start text-center m-auto md:mt-0">
            <h3>What if your group chats were infinite games & gardens?</h3>
            <p className="text-sm italic my-2">
              Space not only to talk, but to explore & build together
            </p>
            <DoorInactive width="128" image="/doors/door-clouds-256.jpg" />
          </div>

          <div className="place-self-start text-center m-auto md:mt-16">
            <h3>
              What if you could build shared worlds for the things that matter?
            </h3>
            <p className="text-sm italic my-2">
              Bespoke structures & systems: map, collect, play, publish
            </p>
            <DoorInactive width="128" image="/doors/door-windowseat-256.jpg" />
          </div>

          <div className="place-self-start text-center m-auto md:mt-32">
            <h3>What if your tools helped you do meaningful long-term work?</h3>
            <p className="text-sm italic my-2">
              A game engine for agency; repeatable recipes for action
            </p>
            <DoorInactive width="128" image="/doors/door-field-256.jpg" />
          </div>
        </div>

        <Divider marginTop="mt-8 md:mt-0" marginBottom="mb-8 md:mb-16" />

        {/* CTA */}
        <div className="max-w-xl m-auto">
          <div className="space-y-8">
            <p className="text-lg font-bold">
              Hyperlink's new platform is in alpha, open by invitation.
            </p>
            <p>
              We're curating book collections, organizing recipes, cultivating
              writing practices, learning music & more…
            </p>
            <p>Want to build learning worlds with us?</p>
            <p>
              We're rolling out invites slowly, but as quickly as we can :) Drop
              your email and we'll keep you posted.
            </p>
          </div>
          {/* newsletter signup! */}
          <NewsletterForm />
          <div className="space-y-8">
            <p>
              If you like,{" "}
              <a
                className="text-accent-blue"
                href="mailto:contact@hyperlink.academy"
              >
                write us
              </a>{" "}
              with ideas for a Space you'd like to make, and we'll get back to
              you!
            </p>
            <p>—Hyperlink Team (Jared + Celine + Brendan)</p>
          </div>
        </div>
      </div>
    </>
  );
}

const Divider = (props: { marginTop: string; marginBottom: string }) => (
  <hr
    className={`skew-x-[14deg] rotate-[14deg] border-[16px] w-64 md:w-96 mx-auto border-dashed border-accent-gold ${props.marginTop} ${props.marginBottom}`}
  />
);

const LoginBar = () => {
  let [isOpen, setLogInModal] = useState(false);
  let { session } = useAuth();

  return (
    <div className="sticky top-0 p-4 bg-white border border-accent-gold z-10">
      {!session?.loggedIn ? (
        <>
          <ButtonLink
            className="justify-self-start"
            content="Hypernaut Entry Portal --> Log In!"
            onClick={() => setLogInModal(true)}
          />
          <LogInModal isOpen={isOpen} onClose={() => setLogInModal(false)} />
        </>
      ) : (
        <Link href={`/s/${session.session.username}`}>
          <a className="justify-self-start flex items-center gap-2">
            <ExitDoor />
            <span>Visit my Studio</span>
          </a>
        </Link>
      )}
    </div>
  );
};

const LoginBox = () => {
  let [isOpen, setIsOpen] = useState(false);
  let { session } = useAuth();
  let router = useRouter();

  return (
    // <div className="px-8 py-4 bg-white border-2 border-dashed border-accent-gold z-10 m-auto">
    <div className="skew-x-[14deg] rotate-[14deg] px-8 py-4 bg-white border-2 border-dashed border-accent-gold z-10 mx-auto my-8 md:my-16">
      {!session?.loggedIn ? (
        <div className="text-center m-auto space-y-2">
          <ButtonLink
            // icon={<ExitDoor />}
            style={{ margin: "auto" }}
            className="justify-self-start"
            content="Hypernaut Entry Portal: Log In!"
            onClick={() => setIsOpen(true)}
          />
          <p className="italic">
            Invite-only for now — read below for details ✨
          </p>
          <Modal open={isOpen} onClose={() => setIsOpen(false)}>
            <LoginForm onLogin={(s) => router.push(`/s/${s.username}`)} />
          </Modal>
        </div>
      ) : (
        <Link href={`/s/${session.session.username}`}>
          <a className="justify-self-start flex items-center gap-2">
            <ExitDoor />
            <span>Visit my Studio</span>
          </a>
        </Link>
      )}
    </div>
  );
};

const NewsletterForm = () => {
  // TODO: migrate email newsletter / buttondown functionality?!

  return (
    <form
      action="https://buttondown.email/api/emails/embed-subscribe/hyperlink"
      method="post"
      target="popupwindow"
      onSubmit={() =>
        window.open("https://buttondown.email/hyperlink", "popupwindow")
      }
      className="embeddable-buttondown-form skew-x-[14deg] rotate-[14deg] px-8 py-4 flex flex-col md:flex-row gap-4 items-center place-content-center  bg-white border-2 border-dashed border-accent-gold z-10 mx-auto my-16 md:my-24"
    >
      <label htmlFor="bd-email">Email: </label>
      <input type="email" name="email" id="bd-email" />
      <input
        className="py-2 px-4 m-0       
      text-white font-bold bg-accent-blue border rounded-md border-accent-blue 
      hover:text-accent-blue hover:bg-bg-blue 
      active:text-accent-blue active:bg-bg-blue active:outline outline-offset-[-2px] active:outline-2 cursor-pointer"
        type="submit"
        value="Subscribe"
      />
      <input type="hidden" name="tag" value="v2-alpha" />
    </form>
  );
};

const DoorInactive = (props: { width?: string; image?: string }) => {
  let color1 = "#ffec96";
  let color2 = "#ffd700";
  let color3 = "#daa520";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "128"}
      height="auto"
      viewBox="0 0 256 576"
      className="flex-none -scale-x-100 m-auto"
      // className="flex-none m-auto"
      overflow="visible"
    >
      <defs>
        <style>
          {`.cls-1{fill:`}
          {color1}
          {`;} .cls-2{fill:`}
          {color2}
          {`;} .cls-3{fill:`}
          {color3}
          {`;} .cls-4{fill:white;}`}
        </style>
        <clipPath id="outer-frame">
          <path
            className="cls-1"
            d="M196.56,521.92,28.19,427.57V119.84c0-27.47,13.1-70.32,57.88-65.3,50.79,5.7,111,78.77,110.9,165.32C196.91,295,196.56,521.92,196.56,521.92Z"
          />
        </clipPath>
      </defs>

      <image
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMin slice"
        xlinkHref={props.image || "/doors/door-clouds-256.jpg"}
        clipPath="url(#outer-frame)"
      />
      <path
        className="cls-2"
        d="M57.65,56.59,61.11,56c8.52-1.08,18.47.22,29.9,4.71,65.93,25.86,95.63,93.83,95.63,144.54V525.81l-26.55-15.27L21.34,430.76V173.12s-.05-1.65,0-4.59V112.7c0-24.62,11.56-50.88,36.31-56.11M1.34,112.7V442.33l205.3,118.05V205.26a180.68,180.68,0,0,0-34-105.48C140.24,54.3,95.84,35.65,66.88,35.65a64.6,64.6,0,0,0-15,1.71,104.81,104.81,0,0,0-14.41,5.51C13.65,55.83,1.34,84.4,1.34,112.7Z"
      />
      <path
        className="cls-1"
        d="M21.34,173.12V430.76l138.75,79.78,26.55-5.28V494.69l-93.7-53.88a1,1,0,0,1-.55,1.83,1,1,0,0,1-.5-.13L47.74,417.12a1,1,0,0,1-.5-.87V93.5c0-18.44,4.85-29,8.47-34.37-31.07,32.59-34.14,92.45-34.37,109.4Z"
      />
      <path
        className="cls-4"
        d="M49.22,97.67V92.92c0-14.46,3-23.73,6-29.36.27-.52.55-1,.82-1.45.08-.15.18-.3.27-.45l.27-.43c.45-.71.9-1.34,1.32-1.89.17-.23.34-.44.51-.64s.25-.31.37-.45.23-.28.35-.4c.32-.37.62-.67.88-.93s.66-.64.93-.89c-.88.11-2.48.39-3.33.56a23.33,23.33,0,0,0-1.93,2.53s0,0,0,0c-3.62,5.33-8.47,15.93-8.47,34.37V416.25a1,1,0,0,0,.5.87l44.15,25.39a1,1,0,0,0,1.37-.37,1,1,0,0,0-.32-1.33L49.22,415.67Z"
      />
      <path
        className="cls-3"
        d="M21.34,112.7v55.83c.23-16.95,3.3-76.81,34.37-109.4,0,0,0,0,0,0a27.69,27.69,0,0,1,1.93-2.53C32.9,61.82,21.34,88.08,21.34,112.7ZM27.57,427a1,1,0,0,1-.45,1.34l0,0a1,1,0,0,1-.43.1,1,1,0,0,1-.89-.56,1,1,0,0,1,1.81-.9Zm4.36-3.45a1,1,0,1,1,.93,1.77l-2.22,1.16a1,1,0,0,1-.46.11,1,1,0,0,1-.89-.54,1,1,0,0,1,.42-1.34Zm13.46-7a1,1,0,0,1,.93,1.77l-9,4.7a.93.93,0,0,1-.46.12,1,1,0,0,1-.46-1.89ZM204.42,119c16.61,36.6,16.91,65.77,16.91,77.52V551.68l-14.69,8.7V205.26a180.68,180.68,0,0,0-34-105.48C140.24,54.3,95.84,35.65,66.88,35.65a64.6,64.6,0,0,0-15,1.71c11.72-3.74,27-7.41,37.1-7.42C127.57,29.91,177.82,60.41,204.42,119ZM186.64,505.26v20.55l-26.55-15.27Z"
      />
    </svg>
  );
};
