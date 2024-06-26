import { isIOS } from "@react-aria/utils";
import { FilterAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { scanIndex } from "hooks/useReplicache";
import { ReadTransaction } from "replicache";

export const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${("0" + month).slice(-2)}-${("0" + day).slice(-2)}`;
};

export const slugify = (str: string) => {
  var specials =
    /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~’]/g;
  return str.trim().replace(specials, "").replace(/\s/g, "-").toLowerCase();
};

export function getLinkAtCursor(text: string, cursor: number) {
  let start: number | undefined;
  let end: number | undefined;
  for (let i = 0; i < 140; i++) {
    let startPosition = cursor - i;
    if (!start && text.slice(startPosition - 2, startPosition) === "[[")
      start = startPosition;
    if (!end && text.slice(cursor + i, cursor + i + 2) === "]]")
      end = cursor + i;
  }
  if (!start || start < 0 || !end) return undefined;
  return {
    value: text.slice(start, end),
    start,
    end,
  };
}

export function focusElement(element: () => HTMLElement | null) {
  let fakeInput: HTMLInputElement | null = null;
  if (isIOS()) {
    //Safari doesn't let you focus outside a user-triggered event loop, so we have to create a fake input to focus
    fakeInput = document.createElement("input");
    fakeInput.setAttribute("type", "text");
    fakeInput.style.position = "fixed";
    fakeInput.style.height = "0px";
    fakeInput.style.width = "0px";
    fakeInput.style.fontSize = "16px"; // disable auto zoom
    document.body.appendChild(fakeInput);
    fakeInput.focus();
  }

  setTimeout(() => {
    element()?.focus({ preventScroll: true });
    fakeInput?.remove();
  }, 500);
}

export const elementID = {
  card: (entityID: string) => ({
    title: `card/${entityID}/title`,
    container: `card/${entityID}/container`,
    content: `card/${entityID}/content`,
    image: `card/${entityID}/image`,
    attachedCards: `card/${entityID}/attachedCards`,
    reactions: `card/${entityID}/attachedCards`,
  }),
  discussion: (entityID: string) => ({
    input: `discussion/${entityID}/input`,
    container: `discussion/${entityID}/container`,
  }),
};

export async function filterFactsByPresences<
  A extends keyof FilterAttributes<{ ephemeral: true }>
>(facts: Fact<A>[], clients: string[], tx: ReadTransaction) {
  let results: Fact<A>[] = [];
  for (let f of facts) {
    let client = await scanIndex(tx).eav(f.entity, "presence/client-id");
    if (!client) continue;
    if (clients.includes(client.value)) results.push(f);
  }
  return results;
}
