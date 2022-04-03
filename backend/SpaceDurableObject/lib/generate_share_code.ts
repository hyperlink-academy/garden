const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32

export const generateShareCode = () => {
  let randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  let result = "";
  randomValues.forEach((v) => {
    let rand = Math.floor((v / 0xff) * ENCODING.length);
    if (rand === ENCODING.length) {
      rand = ENCODING.length - 1;
    }
    result = result + ENCODING.charAt(rand);
  });
  return result;
};
