import { v4 as uuidv4, v5 as uuidv5 } from "uuid";

const DETERMINISTIC_NAMESPACE = "f4b2af51-79db-4db4-9b2b-27c231ad5d1c";

export const generateUuid = (): string => {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  try {
    return uuidv4();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("generateUuid uuid fallback", error);
    }
  }

  const random = Math.random().toString(16).slice(2, 10);
  const timestamp = Date.now().toString(16).slice(-12);
  return `${random.slice(0, 8)}-${random.slice(0, 4)}-4${random.slice(0, 3)}-8${random.slice(0, 3)}-${timestamp.padEnd(12, "0")}`;
};

export const generateDeterministicUuid = (seed: string): string => {
  try {
    return uuidv5(seed, DETERMINISTIC_NAMESPACE);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("generateDeterministicUuid fallback", error);
    }
  }

  const sanitized = seed || "fallback";
  const buffer = Array.from(sanitized).map((char, index) =>
    ((char.charCodeAt(0) + index) % 16).toString(16)
  );
  const hex = buffer.join("" ).padEnd(32, "0").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};
