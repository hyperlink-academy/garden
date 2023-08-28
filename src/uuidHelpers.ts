export function uuidToBase62(uuid: string) {
  const hex = uuid.replace(/-/g, ""); // Remove dashes from UUID
  const num = BigInt(`0x${hex}`); // Convert hexadecimal to BigInt
  let base62 = "";
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let temp = num;
  while (temp > 0) {
    const mod = temp % BigInt(62);
    base62 = characters[Number(mod)] + base62;
    temp = temp / BigInt(62);
  }

  return base62;
}

export function base62ToUuid(base62: string) {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let num = BigInt(0);
  let multiplier = BigInt(1);

  for (let i = base62.length - 1; i >= 0; i--) {
    const value = characters.indexOf(base62[i]);
    num += BigInt(value) * multiplier;
    multiplier *= BigInt(62);
  }

  let hex = num.toString(16);
  while (hex.length < 32) {
    hex = "0" + hex; // Ensure it's the correct length
  }

  // Convert to the standard UUID format
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
