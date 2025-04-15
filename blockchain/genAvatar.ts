// Feature option arrays:
const styleOptions = ["big-smile"];
const seedOptions = ["Riley", "Alexander", "Vivian", "Sadie", "Christopher"];
const accessoriesOptions = ["catEars", "clownNose", "faceMask", "glasses", "mustache", "sailormoonCrown", "sleepMask", "sunglasses"];
const eyesOptions = ["angry", "cheery", "confused", "normal", "sad"];
const hairOptions = ["bangs", "bowlCutHair", "braids", "bunHair", "curlyBob", "curlyShortHair", "froBun", "shortHair", "straightHair", "wavyBob", "mohawk"];
const hairColorOptions = ["3a1a00", "220f00", "238d80", "605de4", "71472d", "d56c0c", "e2ba87", "e9b729"];
const mouthOptions = ["awkwardSmile", "braces", "gapSmile", "kawaii", "openedSmile", "openSad", "teethSmile", "unimpressed"];
const skinColorOptions = ["8c5a2b","643d19","a47539","c99c62","e2ba87","efcc9f","f5d7b1", "ffe4c0"];

/**
 * Gets a feature option from a wallet address substring.
 * @param {string} address - The wallet address (without "0x").
 * @param {number} start - The starting character index.
 * @param {number} length - The number of characters to use.
 * @param {string[]} options - The array of possible options.
 * @returns {string} - The selected feature option.
 */
function getFeatureFromAddressSection(
  address: string,
  start: number,
  length: number,
  options: string[]
): string {
  const substring = address.slice(start, start + length);
  // Parse the substring as a hexadecimal number; use 0 as fallback.
  const value = parseInt(substring, 16) || 0;
  const index = value % options.length;
  const selectedOption = options[index];
  console.log(
    `[DEBUG] Feature selection from address[${start}:${start + length}] ('${substring}') => ${selectedOption}`
  );
  return selectedOption;
}

/**
 * Generate an avatar URL using separate features from the wallet address.
 * @param {string} walletAddress - The full wallet address.
 * @returns {string} - The complete DiceBear avatar URL.
 */
export function generateAvatarUrl(walletAddress: string): string {
  // Remove the "0x" prefix if it exists.
  const address = walletAddress.startsWith("0x")
    ? walletAddress.slice(2)
    : walletAddress;
  console.log("[DEBUG] Wallet address without prefix:", address);

  // Use fixed length segments from the address to pick features.
  // Adjust the segments if your address is too short, using defaults if necessary.
  const style = getFeatureFromAddressSection(address, 0, 5, styleOptions);
  const seed = getFeatureFromAddressSection(address, 5, 5, seedOptions);
  const accessories = getFeatureFromAddressSection(
    address,
    10,
    5,
    accessoriesOptions
  );
  const eyes = getFeatureFromAddressSection(address, 15, 5, eyesOptions);
  const hair = getFeatureFromAddressSection(address, 20, 5, hairOptions);
  const hairColor = getFeatureFromAddressSection(
    address,
    25,
    5,
    hairColorOptions
  );
  const mouth = getFeatureFromAddressSection(address, 30, 5, mouthOptions);
  const skinColor = getFeatureFromAddressSection(
    address,
    35,
    5,
    skinColorOptions
  );

  // Build a query parameter string with these values.
  // Note: DiceBear's API officially supports "seed". The other parameters below are used as an example;
  // you might need to adjust them according to your custom avatar generation backend.
  const queryParams = `seed=${seed}&accessories=${accessories}&eyes=${eyes}&hair=${hair}&hairColor=${hairColor}&mouth=${mouth}&skinColor=${skinColor}&backgroundColor=b6e3f4`;
  console.log("[DEBUG] Query Params:", queryParams);

  // Construct the final URL:
  const url = `https://api.dicebear.com/9.x/${style}/png?${queryParams}`;
  console.log("[DEBUG] Generated Avatar URL:", url);
  return url;
}
