export const sign = async (data: string, secret: string) => {
  var enc = new TextEncoder();
  let key = await crypto.subtle.importKey(
    "raw", // raw format of the key - should be Uint8Array
    enc.encode(secret),
    {
      // algorithm details
      name: "HMAC",
      hash: { name: "SHA-256" },
    },
    false, // export = false
    ["sign", "verify"] // what this key can do
  );
  let sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));

  var b = new Uint8Array(sig);
  var str = Array.prototype.map
    .call(b, (x) => x.toString(16).padStart(2, "0"))
    .join("");
  return str;
};
