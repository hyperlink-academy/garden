import { useAuth } from "hooks/useAuth";
import Link from "next/link";

export default function IndexPage() {
  let { session } = useAuth();

  return (
    <div
      style={{
        backgroundImage: 'url("/img/floating-islands-pattern.png")',
        imageRendering: "pixelated",
      }}
      className="bg-repeat w-full h-full py-8"
    >
      <div className="py-8 px-8 bg-white rounded-md shadow-lg max-w-4xl flex-col gap-8 m-auto flex">
        <h1>Hyperlink is making something new 🌱</h1>
        <h3>
          Imagine: a garden — workshop — playground — for internet creators to…,
        </h3>
        <ul>
          <li className="text-lg">
            <strong>Work & learn in public:</strong> share projects online;
            shape your profile
          </li>
          <li className="text-lg">
            <strong>Build scenes & squads</strong> explore with friends; find
            collaborators
          </li>
        </ul>
        <FancySeperator />
        <p className="text-lg">More soon!</p>
        <p className="text-lg">-Jared, Celine, Brendan</p>
      </div>
    </div>
  );
}

const FancySeperator = () => (
  <img
    style={{ content: 'url("/img/border-sparkle.png")', margin: "10px auto" }}
  />
);
