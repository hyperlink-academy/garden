import { workerAPI } from "backend/lib/api";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const fetcher = async (id: { id: string } | { do_id: string }) => {
  let data = await workerAPI(WORKER_URL, "get_studio_data", id);
  return data.data;
};

const byID = (id: string) => fetcher({ id });
const byDOID = (do_id: string) => fetcher({ do_id: do_id });

export const useStudioData = (
  spaceID?: string,
  fallbackData?: Awaited<ReturnType<typeof fetcher>>
) => {
  return useSWR(spaceID || null, byID, { fallbackData });
};

export const useStudioDataByDOID = (
  do_id?: string,
  fallbackData?: Awaited<ReturnType<typeof fetcher>>
) => {
  return useSWR(
    "studio" + do_id || null,
    () => (do_id ? byDOID(do_id) : null),
    { fallbackData }
  );
};
