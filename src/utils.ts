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
