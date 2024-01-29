import { authToken } from "backend/lib/auth";
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const getAndUploadFile = async (
  items: DataTransferItemList,
  authToken: authToken,
  spaceID: string
) => {
  let results = [];
  for (let i = 0; i < items.length; i++) {
    console.log(i);
    const item = items[i];
    if (!item.type.includes("image")) continue;
    let image = item.getAsFile();
    if (!image) {
      results.push({ success: false } as const);
      continue;
    }
    results.push(
      fetch(`${WORKER_URL}/space/${spaceID}/upload_file`, {
        headers: {
          "X-Authorization-Access-Token": authToken.access_token,
          "X-Authorization-Refresh-Token": authToken.refresh_token,
        },
        method: "POST",
        body: image,
      }).then(
        (result) =>
          result.json() as unknown as
            | { success: false }
            | { success: true; data: { id: string } }
      )
    );
  }
  return Promise.all(results);
};
