// cryptoShim.ts
import 'react-native-get-random-values';
// Optionally polyfill Buffer if needed by ethers
import { Buffer } from "buffer";
if (!global.Buffer) {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Ensure a global crypto object exists.
if (typeof global.crypto === 'undefined') {
  // Create a simple crypto object
  global.crypto = {} as Crypto;
}

// Polyfill for crypto.getRandomValues
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = function<T extends ArrayBufferView | null>(array: T): T {
    if (array === null) {
      throw new TypeError("crypto.getRandomValues: null is not a valid argument");
    }
    // Create a Uint8Array view regardless of input type
    const view = array instanceof Uint8Array
      ? array
      : new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    // Fill with random bytes using Math.random (not cryptographically secure)
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    return array;
  } as <T extends ArrayBufferView | null>(array: T) => T;
}

// Polyfill for crypto.randomBytes using crypto.getRandomValues
if (!('randomBytes' in global.crypto)) {
  Object.defineProperty(global.crypto, 'randomBytes', {
    value: (size: number) => {
      const array = new Uint8Array(size);
      global.crypto.getRandomValues(array);
      return array;
    },
    configurable: true,
    enumerable: true,
    writable: false,
  });
}

// Polyfill for crypto.randomUUID with the expected template literal type.
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return uuid as `${string}-${string}-${string}-${string}-${string}`;
  };
}

// Polyfill for crypto.subtle using Object.defineProperty (dummy implementation)
if (!('subtle' in global.crypto)) {
  Object.defineProperty(global.crypto, 'subtle', {
    value: {} as SubtleCrypto,
    configurable: true,
    enumerable: true,
    writable: false,
  });
}
