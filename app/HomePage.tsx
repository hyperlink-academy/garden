"use client";
import styles from "styles/Landing.module.css";
import Head from "next/head";
import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { BackToHome, Send } from "components/Icons";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoginOrSignupModal } from "components/LoginModal";
import { Divider } from "components/Layout";

export function HomePage() {
  let textFormat = "mx-auto w-full flex max-w-2xl flex-col gap-4";
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
      <div className="landing px-4 py-4 md:px-8 md:py-8">
        {/* main content - inner wrapper */}
        <div className="m-auto mb-8 flex max-w-6xl flex-col gap-8">
          {/* title: hyperlink academy */}
          <div className="my-8 -rotate-3 rounded-md bg-accent-gold px-8 py-32">
            <div className="rotate-3">
              <div className="flex flex-col gap-8">
                {/* title and tagline */}
                <div className="flex flex-col gap-4 text-center">
                  <h1>hyperlink academy</h1>
                  <h2>a set of tools for collaborative creative projects</h2>
                </div>
              </div>
            </div>
          </div>

          {/* internet clubs */}
          <div className="flex flex-col gap-8 rounded-md bg-bg-red p-8">
            <div className={`${textFormat}`}>
              <div className="relative left-[440px] top-[32px] w-fit rotate-3 rounded-md bg-accent-red p-2 text-white">
                in progress!
              </div>
              <h2 className="text-center">Internet Clubs</h2>

              <p>
                We&apos;re playing with{" "}
                <strong>a new kind of internet club</strong> — communities of
                practice where we make and explore things together.
              </p>
              <p>
                In each club we work async in Spaces, explore and chat about
                each other&apos;s work, and share updates with a group digest.
              </p>
            </div>

            <h3 className="text-center">Current Clubs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex h-48 place-content-center items-center rounded-md bg-bg-blue">
                <h3>Handmade March</h3>
              </div>
              <div className="flex h-48 place-content-center items-center rounded-md bg-bg-blue">
                <h3>Internet Homesteading</h3>
              </div>
              <div className="flex h-48 place-content-center items-center rounded-md bg-bg-blue">
                <h3>Pedagogical Parents</h3>
              </div>
            </div>

            <div className={`${textFormat} items-center text-center`}>
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
          <h2 className="text-center">What is Hyperlink</h2>
          <div className={`${textFormat}`}>
            <p className="text-[1.4rem]">
              Hyperlink is a place to do ambitious creative projects with
              friends, partners, and co-conspirators.
            </p>
            <p>
              Use it as a shared notebook, a place for conversation, and a tool
              for coordination. There&apos;s no better tool for creating,
              collecting, and sharing group work and artifacts.
            </p>
          </div>

          {/* pieces and features */}
          <div>
            <div className="py-8">
              <h3 className="mb-8 text-center">The Pieces</h3>
              {/* <div className="text-center">PIECES GO HERE!</div> */}
              <div className="bg-bg-blue p-4">
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
                      organize your work — collections, canvases, and chat rooms
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
              </div>
            </div>

            <h3 className="mb-8 text-center">The Features</h3>
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Invites</strong>
                </p>
                <p>Invite people to join Spaces and Studios</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Discussion</strong>
                </p>
                <p>Chat channels and comments on any card</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Audio Calls</strong>
                </p>
                <p>Talk together directly in a Space</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Backlinks</strong>
                </p>
                <p>See anywhere a card is referenced</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Calendar</strong>
                </p>
                <p>Assign dates to cards; view and track past and future</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Links</strong>
                </p>
                <p>Attach cards or add inline wiki-style references</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Multiplayer Presence</strong>
                </p>
                <p>See when others are there with you — and where</p>
              </div>
              <div className="flex flex-col gap-2 rounded-md bg-white p-4">
                <p>
                  <strong>Push Notifications</strong>
                </p>
                <p>When you add the web app on mobile!</p>
              </div>
            </div>
          </div>

          {/* the hyperlink vision */}
          {/* TBD! */}
          {/* e.g. "read more about our vision here…" */}

          {/* notes on pricing */}
          <div className={`${textFormat} rounded-md bg-grey-90 p-8`}>
            <h2>Preliminary notes on pricing</h2>
            {/* Hyperlink is FREE! ... for now */}

            <p>
              <strong>Hyperlink is free while we&apos;re in beta.</strong> Our
              plan is to make the app useful in real ways for free, forever, and
              also charge for it when and where that makes sense.
            </p>

            <p>
              Hyperlink exists to help you do ambitious, meaningful things. To
              make sure we&apos;re able to keep making Hyperlink better, we aim
              to figure out a fair pricing model soon.
            </p>

            <p>Early sketches for what we&apos;re imagining:</p>

            <div className="my-4 grid grid-cols-3 gap-8">
              <div className="flex -rotate-3 flex-col gap-4 rounded-md bg-bg-gold p-4 text-sm">
                <h3>Free</h3>
                <p>A flexible free tier to try everything.</p>
                <p>Make lots of Spaces, with minimal feature limits.</p>
              </div>
              <div className="flex rotate-2 flex-col gap-4 rounded-md bg-bg-gold p-4 text-sm">
                <h3>Scholar</h3>
                <p>
                  We&apos;ll charge for things that cost us more to run, like:
                </p>
                <ul className="ml-4 list-disc">
                  <li>Unlimited Spaces</li>
                  <li>Private Spaces</li>
                  <li>More uploads</li>
                </ul>
              </div>
              <div className="flex -rotate-6 flex-col gap-4 rounded-md bg-bg-gold p-4 text-sm">
                <h3>School / Org</h3>
                <p>
                  For larger communities cost might scale with size, with extras
                  like:
                </p>
                <ul className="ml-4 list-disc">
                  <li>Admin tools</li>
                  <li>Studio customization</li>
                  <li>Personalized support</li>
                </ul>
              </div>
            </div>

            <p>
              We&apos;d love to hear your thoughts, especially if there are
              things that&apos;d make you excited to pay for Hyperlink.
            </p>

            <p>
              If you run a community, school, or institution interested in a
              home base for group activity, please{" "}
              <a
                href="mailto:contact@hyperlink.academy"
                className="font-bold text-accent-blue"
              >
                get in touch
              </a>{" "}
              so we can learn more about what you need and how we can help!
            </p>
          </div>

          {/* get started! */}
          <div className="m-auto flex flex-col gap-8">
            <div className="flex flex-col items-center p-8 text-center">
              {/* <h2>Let&apos;s get started!</h2> */}
              <div className="my-4 -rotate-3 bg-accent-gold px-16 py-16">
                <div className="rotate-3">
                  <div className="flex flex-col items-center gap-4">
                    {/* simplified - signup button only (if we bypass homepage for logged in users) */}
                    {/* <ButtonPrimary
                      content="Sign up for Hyperlink!"
                      onClick={() => setLoginOrSignupState("signup")}
                    /> */}

                    {/* login / signup links */}
                    {/* <div className="flex flex-row gap-2 self-center"> */}
                    {!session?.loggedIn ? (
                      <>
                        <h2>Let&apos;s get started!</h2>
                        <p>Join to make Spaces & Studios</p>
                        <p>⬇️ ↓ ⬇ ⤵️ ↯ ⏬ ⇣</p>
                        <ButtonPrimary
                          content="Sign up for Hyperlink!"
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
                      <>
                        <h2>Let&apos;s get started!</h2>
                        <p>You&apos;re already logged in ☀️</p>
                        <Link
                          href={`/s/${session.session.username}`}
                          // className="mx-auto flex items-center justify-center gap-2 hover:text-accent-blue"
                        >
                          {/* <BackToHome />
                            <span>
                              <strong>visit my homepage</strong>
                            </span> */}
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
                          {/* <BackToHome />
                          <span>
                            <strong>finish account setup!</strong>
                          </span> */}
                          <ButtonPrimary
                            content="finish account setup"
                            icon={<BackToHome />}
                          />
                        </Link>
                      </>
                    )}
                    {/* </div> */}
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
                <input placeholder="email"></input>
                <ButtonPrimary content="Subscribe!" />
              </div>
            </div>

            {/* <div className="text-center">
              <p className="text-lg">
                Questions?{" "}
                <a
                  href="mailto:contact@hyperlink.academy"
                  className="text-accent-blue"
                >
                  Send us a note ✨🌱
                </a>
              </p>
            </div> */}
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
