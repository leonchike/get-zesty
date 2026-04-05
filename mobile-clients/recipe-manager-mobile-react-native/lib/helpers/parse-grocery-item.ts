type ParsedGroceryItem = {
  name: string;
  quantity?: number;
  quantityUnit?: string;
};

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

// function normalizeUnit(unit: string): string | undefined {
//   const lowercaseUnit = unit.toLowerCase().replace(".", "");
//   return unitMap[lowercaseUnit];
// }

function normalizeUnit(unit: string): string | undefined {
  const lowercaseUnit = unit.toLowerCase().replace(".", "");
  // Add single-letter units to the unitMap
  const singleLetterUnits = {
    g: "g",
    l: "liter",
    m: "m",
    // Add other single-letter units as needed
    k: "kilogram",
    c: "cup",
    t: "teaspoon",
    T: "tablespoon",
  };
  return (
    unitMap[lowercaseUnit] ||
    singleLetterUnits[lowercaseUnit as keyof typeof singleLetterUnits] ||
    lowercaseUnit
  );
}

export function parseGroceryItemInput(input: string): ParsedGroceryItem {
  input = input.trim();

  // Initialize the result object
  let result: ParsedGroceryItem = {
    name: "",
    quantity: undefined,
    quantityUnit: undefined,
  };

  // Handle inputs that are just numbers
  const numberOnlyRegex = /^(\d+(?:\.\d+)?)$/;
  const numberOnlyMatch = input.match(numberOnlyRegex);
  if (numberOnlyMatch) {
    return {
      name: "item",
      quantity: parseFloat(numberOnlyMatch[1]),
      quantityUnit: undefined,
    };
  }

  // Handle "and" in quantities (e.g., "1 and 1/2 cups sugar")
  const andRegex = /(\d+)\s+and\s+(\d+\/\d+|\d+(?:\.\d+)?)/;
  input = input.replace(andRegex, (_, whole, fraction) => {
    const wholeNum = parseInt(whole);
    let fractionNum: number;
    if (fraction.includes("/")) {
      const [numerator, denominator] = fraction.split("/").map(Number);
      fractionNum = numerator / denominator;
    } else {
      fractionNum = parseFloat(fraction);
    }
    return (wholeNum + fractionNum).toString();
  });

  // Handle fractions and mixed numbers
  const fractionRegex = /(\d+)?\s*(\d+\/\d+)/;
  input = input.replace(fractionRegex, (_, whole, fraction) => {
    const [numerator, denominator] = fraction.split("/").map(Number);
    const value = (whole ? Number(whole) : 0) + numerator / denominator;
    return value.toString();
  });

  // Handle "half dozen" case
  const halfDozenRegex = /^half\s+dozen\s+(.+)$/i;
  const halfDozenMatch = input.match(halfDozenRegex);
  if (halfDozenMatch) {
    return {
      name: halfDozenMatch[1],
      quantity: 0.5,
      quantityUnit: "doz",
    };
  }

  // Check for common measurement terms that might be part of a product name
  const productNameWithMeasurementRegex =
    /^(.*?\s+\d+\s*(?:in|inch|ft|foot|yd|yard|cm|m|mm))$/i;
  const productNameMatch = input.match(productNameWithMeasurementRegex);
  if (productNameMatch) {
    return {
      name: productNameMatch[1],
      quantity: undefined,
      quantityUnit: undefined,
    };
  }

  // Handle compound units (e.g., "6-pack")
  const compoundUnitRegex = /^(\d+)-([a-zA-Z]+)\s+(.+)$/;
  const compoundUnitMatch = input.match(compoundUnitRegex);
  if (compoundUnitMatch) {
    return {
      name: compoundUnitMatch[3].trim(),
      quantity: parseInt(compoundUnitMatch[1]),
      quantityUnit: normalizeUnit(compoundUnitMatch[2]),
    };
  }

  // Handle multiple units (e.g., "3 lbs 2 oz chicken" or "chicken 3 lbs 2 oz")
  const multipleUnitsRegex =
    /^(?:(.+?)\s+)?(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]+)(?:\s+(.+))?$/;
  const multipleUnitsMatch = input.match(multipleUnitsRegex);
  if (multipleUnitsMatch) {
    const preName = multipleUnitsMatch[1];
    const quantity1 = parseFloat(multipleUnitsMatch[2]);
    const unit1 = normalizeUnit(multipleUnitsMatch[3]);
    const postName = multipleUnitsMatch[6];

    return {
      name: preName ? preName.trim() : postName ? postName.trim() : "item",
      quantity: quantity1,
      quantityUnit: unit1,
    };
  }

  // Handle percentage in product names
  const percentageRegex = /^((?:\d+(?:\.\d+)?%\s+)?.+)$/;
  const percentageMatch = input.match(percentageRegex);
  if (percentageMatch && percentageMatch[1].includes("%")) {
    return {
      name: percentageMatch[1],
      quantity: undefined,
      quantityUnit: undefined,
    };
  }

  // Handle percentages (e.g., "2% milk 1 gallon")
  const percentageWithQuantityRegex =
    /^(\d+%[^0-9]*)(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/i;
  const percentageWithQuantityMatch = input.match(percentageWithQuantityRegex);
  if (percentageWithQuantityMatch) {
    return {
      name: percentageWithQuantityMatch[1].trim(),
      quantity: parseFloat(percentageWithQuantityMatch[2]),
      quantityUnit: normalizeUnit(percentageWithQuantityMatch[3]),
    };
  }

  // Handle "x" in quantities (e.g., "1 x 2 cups sugar")
  const axbUnitRegex = /^(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)$/i;
  const axbUnitMatch = input.match(axbUnitRegex);
  if (axbUnitMatch) {
    const quantity = parseFloat(axbUnitMatch[1]) * parseFloat(axbUnitMatch[2]);
    const unit = normalizeUnit(axbUnitMatch[3]);
    const name = axbUnitMatch[4].trim();
    return {
      name,
      quantity,
      quantityUnit: unit,
    };
  }

  // Handle quantity ranges (e.g., "4-6 tomatoes" or "4 -6 tomatoes")
  const rangeRegex = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s+(.+)$/;
  const rangeMatch = input.match(rangeRegex);
  if (rangeMatch) {
    const lowerBound = parseFloat(rangeMatch[1]);
    const upperBound = parseFloat(rangeMatch[2]);
    return {
      name: rangeMatch[3].trim(),
      quantity: Math.max(lowerBound, upperBound),
      quantityUnit: undefined,
    };
  }

  // Match quantity, unit, and name in various positions
  const regex =
    /^(?:(\d*\.?\d+)\s*([a-zA-Z.-]+(?:-[a-zA-Z]+)?)?\s*(.+))|(?:(.+?)\s+(\d*\.?\d+)\s*([a-zA-Z.-]+(?:-[a-zA-Z]+)?)?)$/;
  const match = input.match(regex);

  if (match) {
    let quantity: number | undefined;
    let unit: string | undefined;
    let name: string = "";

    if (match[1]) {
      // Quantity at the beginning
      quantity = parseFloat(match[1]);
      unit = match[2] ? normalizeUnit(match[2]) : undefined;
      name = match[3] || "item";
    } else if (match[4]) {
      // Quantity at the end
      name = match[4];
      quantity = parseFloat(match[5]);
      unit = match[6] ? normalizeUnit(match[6]) : undefined;
    }

    // Check if the unit is actually part of the name (e.g., "bananas" in "3 bananas")
    if (
      unit &&
      !unitMap[unit.toLowerCase()] &&
      !["pc", "piece", "pieces"].includes(unit.toLowerCase())
    ) {
      name = `${unit} ${name}`.trim();
      unit = undefined;
    }

    // Remove any extra space before 's' at the end of the name
    name = name.replace(/\s+s$/, "s");

    return {
      name: name.trim(),
      quantity,
      quantityUnit: unit,
    };
  }
  // If no quantity or unit found, return just the name
  return {
    name: input || "item",
    quantity: undefined,
    quantityUnit: undefined,
  };
}
