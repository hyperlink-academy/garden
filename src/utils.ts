import { isIOS } from "@react-aria/utils";

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

export function focusElement(element?: HTMLElement | null) {
  if (!element) return;
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
    element?.focus();
    fakeInput?.remove();
  }, 10);
}
