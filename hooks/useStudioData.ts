import { workerAPI } from "backend/lib/api";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const fetcher = async (id: string) => {
  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id,
  });
  return data.data;
};
export const useStudioData = (
  spaceID?: string,
  fallbackData?: Awaited<ReturnType<typeof fetcher>>
) => {
  return useSWR(spaceID || null, fetcher, { fallbackData });
};
