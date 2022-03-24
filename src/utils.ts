// These values should NEVER change. If
// they do, we're no longer making ulids!
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

const prng = () => {
  const buffer = new Uint8Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0xff;
};

function randomChar() {
  let rand = Math.floor(prng() * ENCODING_LEN);
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }
  return ENCODING.charAt(rand);
}

function encodeTime(now: number, len: number) {
  if (now > TIME_MAX) {
    throw new Error("cannot encode time greater than " + TIME_MAX);
  }
  if (now < 0) {
    throw new Error("time must be positive");
  }
  if (Number.isInteger(now) === false) {
    throw new Error("time must be an integer");
  }
  let mod: number;
  let str = "";
  for (; len > 0; len--) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

export function encodeRandom(len: number) {
  let str = "";
  for (; len > 0; len--) {
    str = randomChar() + str;
  }
  return str;
}
export function decodeTime(id: string) {
  if (id.length !== TIME_LEN + RANDOM_LEN) {
    throw new Error("malformed ulid");
  }
  var time = id
    .substr(0, TIME_LEN)
    .split("")
    .reverse()
    .reduce((carry, char, index) => {
      const encodingIndex = ENCODING.indexOf(char);
      if (encodingIndex === -1) {
        throw new Error("invalid character found: " + char);
      }
      return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
    }, 0);
  if (time > TIME_MAX) {
    throw new Error("malformed ulid, timestamp too large");
  }
  return time;
}

export function ulid() {
  let seedTime = Date.now();
  return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN);
}
