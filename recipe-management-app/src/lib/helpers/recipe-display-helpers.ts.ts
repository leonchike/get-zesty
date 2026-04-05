import Fraction from "fraction.js";

export function calculateTotalTime(
  prepTime?: number | null,
  cookTime?: number | null,
  restTime?: number | null
): number | null {
  const times = [prepTime, cookTime, restTime].filter(
    (time): time is number => typeof time === "number" && time > 0
  );

  if (times.length === 0) {
    return null;
  }

  return times.reduce((total, time) => total + time, 0);
}

// export function humanReableTime(minutes: number | null): string {
//   if (!minutes) return "";
//   const hours = Math.floor(minutes / 60);
//   const remainingMinutes = minutes % 60;
//   if (hours === 0) return `${remainingMinutes}m`;
//   if (remainingMinutes === 0) return `${hours}h`;
//   return `${hours}h ${remainingMinutes}m`;
// }

export function humanReadableTime(minutes: number | null): string {
  if (minutes === null || minutes === 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function humanReadableUnit({ unit }: { unit: string | undefined }) {
  if (!unit) return "";
  return unitMap[unit] || unit;
}

export const unitMap: { [key: string]: string } = {
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  l: "liter",
  liter: "liter",
  liters: "liter",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  pc: "pc",
  piece: "pc",
  pieces: "pc",
  pack: "pack",
  package: "pack",
  packages: "pack",
  box: "box",
  boxes: "box",
  can: "can",
  cans: "can",
  bottle: "bottle",
  bottles: "bottle",
  cup: "cup",
  cups: "cup",
  tbs: "tbsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  doz: "doz",
  dozen: "doz",
  dozens: "doz",
  gal: "gal",
  gallon: "gal",
  gallons: "gal",
  qt: "qt",
  quart: "qt",
  quarts: "qt",
  pt: "pt",
  pint: "pt",
  pints: "pt",
  bunch: "bunch",
  slice: "slice",
  slices: "slice",
  clove: "clove",
  cloves: "clove",
  head: "head",
  heads: "head",
  stalk: "stalk",
  stalks: "stalk",
  sprig: "sprig",
  sprigs: "sprig",
  pinch: "pinch",
  pinches: "pinch",
  dash: "dash",
  dashes: "dash",
  drop: "drop",
  drops: "drop",
  handful: "handful",
  handfuls: "handful",
  stick: "stick",
  sticks: "stick",
  leaf: "leaf",
  leaves: "leaf",
  wedge: "wedge",
  wedges: "wedge",
  fillet: "fillet",
  fillets: "fillet",
  scoop: "scoop",
  scoops: "scoop",
  jar: "jar",
  jars: "jar",
  tin: "tin",
  tins: "tin",
  bag: "bag",
  bags: "bag",
  carton: "carton",
  cartons: "carton",
  roll: "roll",
  rolls: "roll",
  strip: "strip",
  strips: "strip",
  cube: "cube",
  cubes: "cube",
  bulb: "bulb",
  bulbs: "bulb",
  knob: "knob",
  knobs: "knob",
  sheet: "sheet",
  sheets: "sheet",
  fl: "fl oz",
  "fl oz": "fl oz",
  "fluid oz": "fl oz",
  "fluid ounce": "fl oz",
  "fluid ounces": "fl oz",
};

export function decimalToFraction(decimal: number | undefined): string {
  if (decimal === undefined) return "";
  if (decimal === 0) return "0";

  const fraction = new Fraction(decimal);
  const wholePart = Math.floor(fraction.valueOf());
  const fractionalPart = fraction.mod(1);

  if (fractionalPart.valueOf() === 0) {
    return wholePart.toString();
  } else if (wholePart === 0) {
    return simplifyFraction(fractionalPart);
  } else {
    return `${wholePart} ${simplifyFraction(fractionalPart)}`;
  }
}

function simplifyFraction(fraction: Fraction): string {
  const simplified = fraction.simplify();
  const numerator = simplified.n;
  const denominator = simplified.d;

  // Common fractions mapping
  const commonFractions: { [key: string]: string } = {
    "1/2": "½",
    "1/3": "⅓",
    "2/3": "⅔",
    "1/4": "¼",
    "3/4": "¾",
    "1/5": "⅕",
    "2/5": "⅖",
    "3/5": "⅗",
    "4/5": "⅘",
    "1/6": "⅙",
    "5/6": "⅚",
    "1/8": "⅛",
    "3/8": "⅜",
    "5/8": "⅝",
    "7/8": "⅞",
  };

  const fractionString = `${numerator}/${denominator}`;
  return commonFractions[fractionString] || fractionString;
}
