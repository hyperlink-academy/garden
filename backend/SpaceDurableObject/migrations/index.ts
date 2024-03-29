import m2022_07_18 from "./2022-07-18";
import m2022_07_19 from "./2022-07-19";
import m2022_07_20 from "./2022-07-20";
import m2022_08_01 from "./2022-08-01";
import m2022_08_10 from "./2022-08-10";
import m2022_08_30 from "./2022-08-30";
import m2023_01_25 from "./2023-01-25";
import m2023_01_31 from "./2023-01-31";
import m2023_02_02 from "./2023-02-02";
import m2023_02_07 from "./2023-02-07";
import m2023_02_08 from "./2023-02-08";
import m2023_02_13 from "./2023-02-13";
import m2023_03_06 from "./2023-03-06";
import m2023_03_15 from "./2023-03-15";
import m2023_03_17 from "./2023-03-17";
import m2023_03_18 from "./2023-03-18";
import m2023_03_20 from "./2023-03-20";
import m2023_09_04 from "./2023-09-04";
import m2023_09_08 from "./2023-09-08";
import m2024_01_20 from "./2024-01-20";
import m2024_02_21 from "./2024-02-21";

export const latestMigration = "2022-07-19";
export const migrations = [
  m2022_07_18,
  m2022_07_19,
  m2022_07_20,
  m2022_08_01,
  m2022_08_10,
  m2022_08_30,
  m2023_01_25,
  m2023_01_31,
  m2023_02_02,
  m2023_02_07,
  m2023_02_08,
  m2023_02_13,
  m2023_03_06,
  m2023_03_15,
  m2023_03_17,
  m2023_03_18,
  m2023_03_20, //fucked up the dates here should be m2023_03_22
  m2023_09_04,
  m2023_09_08,
  m2024_01_20,
  m2024_02_21,
].sort((a, b) => {
  return a.date > b.date ? 1 : -1;
});
