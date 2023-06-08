import { workerAPI } from "backend/lib/api";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const fetcher = async (name: string) => {
  let data = await workerAPI(WORKER_URL, "get_studio", {
    name: name,
  });
  if (data.success) return data.data;
};

export const useStudioData = (
  studio: string,
  fallbackData?: Awaited<ReturnType<typeof fetcher>>
) => useSWR(studio, fetcher, { fallbackData });
