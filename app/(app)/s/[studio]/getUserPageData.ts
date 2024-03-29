import { cache } from "react";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";

export const getUserPageData = cache(({ studio }: { studio: string }) => {
  return workerAPI(WORKER_URL, "get_identity_data", {
    name: studio,
  });
});
