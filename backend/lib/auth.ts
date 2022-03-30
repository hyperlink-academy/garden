type SignedToken = {
  signature: string;
  data: string;
};

type Token = {
  studio: string;
  username: string;
};

function stringToUint8Array(str: string) {
  let byteString = atob(str);
  const ui = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; ++i) {
    ui[i] = byteString.charCodeAt(i);
  }
  return ui;
}

export async function ValidateToken(t: SignedToken, key: CryptoKey) {
  let signature = stringToUint8Array(t.signature);
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(t.data)
  );
}

export function importKey(secret: string) {
  let keyData = new TextEncoder().encode(secret);
  let key = crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return key;
}

export async function SignToken(
  t: Token,
  secret: CryptoKey
): Promise<SignedToken> {
  let data = JSON.stringify(t);
  let signature = await crypto.subtle.sign(
    "HMAC",
    secret,
    new TextEncoder().encode(data)
  );
  return {
    signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
    data,
  };
}
