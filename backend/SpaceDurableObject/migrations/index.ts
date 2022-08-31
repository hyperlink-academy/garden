import m2022_07_18 from "./2022-07-18";
import m2022_07_19 from "./2022-07-19";
import m2022_07_20 from "./2022-07-20";
import m2022_08_01 from "./2022-08-01";
import m2022_08_10 from "./2022-08-10";
import m2022_08_30 from "./2022-08-30";

export const latestMigration = "2022-07-19";
export const migrations = [
  m2022_07_18,
  m2022_07_19,
  m2022_07_20,
  m2022_08_01,
  m2022_08_10,
  m2022_08_30,
].sort((a, b) => {
  return a.date > b.date ? 1 : -1;
});
