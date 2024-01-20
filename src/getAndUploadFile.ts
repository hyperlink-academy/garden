import { authToken } from "backend/lib/auth";
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const getAndUploadFile = async (
  items: DataTransferItemList,
  authToken: authToken,
  spaceID: string
) => {
  let results = [];
  for (let item of items) {
    if (!item.type.includes("image")) continue;
    let image = item.getAsFile();
    if (!image) results.push({ success: false } as const);
    let res = await fetch(`${WORKER_URL}/space/${spaceID}/upload_file`, {
      headers: {
        "X-Authorization-Access-Token": authToken.access_token,
        "X-Authorization-Refresh-Token": authToken.refresh_token,
      },
      method: "POST",
      body: image,
    });
    let data = (await res.json()) as
      | { success: false }
      | { success: true; data: { id: string } };

    results.push(data);
  }
  return results;
};
