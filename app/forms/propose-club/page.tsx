import { submit_club_proposal } from "backend/actions/submit_club_proposal";
import { ButtonPrimary } from "components/Buttons";
import { DotLoader } from "components/DotLoader";

export const metadata = {
  title: "Propose an Internet Club!",
};

export default async function ProposeClubForm() {
  return (
    <form
      action={submit_club_proposal}
      className="proposeClubForm mx-auto flex w-full max-w-2xl flex-col gap-4 p-4"
    >
      <div className="flex flex-col gap-4">
        <h1>Propose an Internet Club!</h1>
        <p>
          Hyperlink is experimenting with internet clubs — using Spaces to work,
          Studios as group homepage, and email to share regular activity.
        </p>
        <p>These clubs are…</p>
        <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
          <li>places for learning & parallel play</li>
          <li>communities of projects with a shared theme</li>
          <li>mostly async + knit together with periodic updates</li>
        </ul>
        {/* <p>
          We describe how it works in{" "}
          <a href="" className="text-accent-blue">
            more detail here
          </a>
          ; the key parts are:
        </p> */}
        <p>The key parts are:</p>
        <ul className="flex list-disc flex-col gap-1 pl-4 sm:pl-8">
          <li>participants make Spaces where they share regular updates</li>
          <li>you email the group a digest of activity, on a chosen cadence</li>
        </ul>

        <p>
          This is an experiment, so facilitators will do some things (like
          sending email digests) manually; over time we&apos;ll build things in
          Hyperlink to help! For now there&apos;s no cost for either creator or
          participants.
        </p>
        <p>We&apos;re excited to see what you have in mind!</p>
      </div>

      <label className="grid-flow-rows grid gap-2" htmlFor="name">
        <p className="font-bold">Name</p>
        <input className="" type="text" required name="name" />
      </label>

      <label className="grid-flow-rows grid gap-2" htmlFor="email">
        <p className="font-bold">Email</p>
        <input className="" type="email" required name="email" />
      </label>

      <label className="grid-flow-rows grid gap-2" htmlFor="about">
        <p className="font-bold">What&apos;s your club about?</p>
        <p className="text-sm italic">
          in a few words e.g. &quot;pottery craft circle&quot; or &quot;internet
          history reading group&quot;
        </p>
        <input className="" type="text" required name="about" />
      </label>

      <label className="grid-flow-rows grid gap-2" htmlFor="activity">
        <p className="font-bold">What activity are participants doing?</p>
        <p className="text-sm italic">
          describe the core thing each person is working on, e.g. &quot;project
          log for a personal website&quot; or &quot;each reading a book and
          sharing notes&quot;
        </p>
        <textarea className="" required name="activity" />
      </label>

      <label className="grid-flow-rows grid gap-2" htmlFor="structure">
        <p className="font-bold">
          What&apos;s the structure? Ideal number of participants? Update
          cadence?
        </p>
        <p className="text-sm italic">
          e.g. &quot;three of my friends, sharing weekly updates for three
          months&quot; or &quot;10-20 people, sharing daily updates for a
          week&quot;
        </p>
        <textarea className="" required name="structure" />
      </label>

      <label className="grid-flow-rows grid gap-2" htmlFor="success">
        <p className="font-bold">What does success look like?</p>
        <p className="text-sm italic">
          how do you want it to end, and what do you want to get out of it? any
          ideal artifacts or output?
        </p>
        <textarea className="" required name="success" />
      </label>

      <div className="grid justify-items-end text-right">
        <ButtonPrimary
          //   content={status === "loading" ? "" : "Send Reset Link"}
          //   icon={status === "loading" ? <DotLoader /> : undefined}
          content="Submit!"
          type="submit"
        />
      </div>
    </form>
  );
}
