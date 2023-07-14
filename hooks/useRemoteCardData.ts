import { spaceAPI } from "backend/lib/api";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const fetcher = async ([do_id, cardEntity]: [string, string]) => {
  let data = await spaceAPI(`${WORKER_URL}/space/${do_id}`, "get_card_data", {
    cardEntity,
  });
  return data;
};
export const useRemoteCardData = (
  do_id?: string,
  cardEntity?: string,
  fallbackData?: Awaited<ReturnType<typeof fetcher>>
) => {
  return useSWR([do_id, cardEntity], fetcher, { fallbackData });
};
