import Head from "next/head";
import Link from "next/link";

export default function IndexPage() {
  //   let textFormat = "mx-auto flex max-w-2xl flex-col gap-4 px-4";
  return (
    <>
      <Head>
        <title key="title">Hyperlink Academy</title>
      </Head>
      {/* page wrapper */}
      <div className="m-auto flex max-w-6xl flex-col gap-6 py-2 px-2">
        <div className="text-center">
          <Link className="text-accent-blue" href="/">
            ← home
          </Link>
        </div>
        {/* letter wrapper */}
        <div className="mb-8 flex flex-col gap-12 rounded-md bg-white p-8 pt-12 drop-shadow">
          <div className="m-auto w-min -rotate-3 rounded-md border-4 border-accent-gold bg-white p-4 md:w-fit md:p-8">
            <h1 className="text-lg md:text-2xl">
              to: the artist experimentalist
            </h1>
          </div>
          <div className="flex flex-col gap-4 md:text-xl">
            <p>
              Your relentless, radiant tinkering is the infinite renewable
              energy source of the internet, and what powers the internet powers
              the world.
            </p>
            <p>The work you make is real magic; it touches and transforms.</p>
            <p>It&apos;s divinatory; it prefigures the future.</p>
            <p>
              Someone said tweeting is tapping a tuning fork to see who
              resonates. You&apos;ve got a tuning fork tool belt, emitting
              resonance in the form of essays, artworks, provocations.
            </p>
            <p>
              The things you make: prompts for comics creation, adventures in
              visual language; generative art that explores the nature of
              nature; tools for art-making, poetic programming, bespoke digital
              infrastructure; creative systems; subversive games; inventive
              zines; business as creative practice, artistic mischief as serious
              business; social practice simulations…
            </p>
            <Divider />
            <p>
              We dream of a site for experiments — a place on the internet where
              we can explore things together. Shared studio spaces, playful and
              permeable, generous and generative.
            </p>
            <p>
              We want software that sparks something special, takes us on
              winding tours down new avenues of creative inquiry.
            </p>
            <p>
              We want tools that flip-flop us from the embodied world to the
              info-plane and back again. That propel new protocols for doing
              things with intention, together.
            </p>
            <p>We want canvases for creating collaborative games.</p>
            <p>We want to make this for us, and for you.</p>
            <Divider />
            <p>
              Our goal is to help you be more creatively productive, fulfilled,
              and connected.
            </p>
            <p>
              When you get deep enough, creativity and meta-creativity blur;
              experience yields new tools and new practices that can be
              transplanted and shared.
            </p>
            <p>
              It&apos;s good to talk about this stuff. We can make the messy
              work in progress feel more tangible. Make the primordial soup more
              appetizing.
            </p>
            <p>
              The creator&apos;s path is forever unmapped terrain. We make no
              promises but that we&apos;ll keep moving forward, exploring ways
              to catalyze experiments, reach new collaborators, create
              transformative experiences.
            </p>
            <Divider />
            <p>
              There are all kinds of paradoxes here — harnessing constraints in
              service of creative infinitude, focusing in order to go wide and
              deep and expansive, online acts that mean to improve the real
              world.
            </p>
            <p>
              You&apos;re no stranger to paradox, or to playing catch-up to a
              vision.
            </p>
            <p>
              We&apos;re on this journey with an uncertain path and a long way
              to go. We&apos;d love you to join, walk with us, talk, make, and
              play together.
            </p>
            <p>—The Hyperlink Team</p>
          </div>
        </div>
      </div>
    </>
  );
}

const Divider = () => (
  // <hr
  //   className={`mx-auto w-64 rotate-[14deg] skew-x-[14deg] border-[12px] border-solid border-accent-gold md:w-96 ${props.marginTop} ${props.marginBottom}`}
  // />
  <div className="py-2 text-center text-accent-blue">
    <p>~</p>
  </div>
);
