const Nouns = ["Seashells", "Telescope", "Usurper", "Cornucopia", "Metropolis"];

const Adjectives = ["Undecipherable", "Yawning", "Old", "Spiral"];

const adjective = () =>
  Adjectives[Math.floor(Math.random() * Adjectives.length)];
const noun = () => Nouns[Math.floor(Math.random() * Nouns.length)];
export const title = () => {
  return `${adjective()} ${adjective()} ${noun()} ${Math.floor(
    Math.random() * 1000
  ).toString()}`;
};
