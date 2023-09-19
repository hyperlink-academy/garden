import { workerAPI } from "backend/lib/api";
import useSWR, { mutate } from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const fetcher = async (name: string) => {
  let data = await workerAPI(WORKER_URL, "get_identity_data", {
    name: name,
  });
  if (data.success) return data.data;
};

export const prefetchIdentityData = async (name: string) => {
  let data = await fetcher(name);
  mutate(name, data);
};

export const useIdentityData = (
  studio: string | null | undefined,
  fallbackData?: Awaited<ReturnType<typeof fetcher>>
) => useSWR(studio, fetcher, { fallbackData });
