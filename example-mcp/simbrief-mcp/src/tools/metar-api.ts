/**
 * Aviation Weather METAR API Client
 *
 * Fetches current METAR weather observations from aviationweather.gov
 */

import type { MetarApiResponse, MetarResult, MetarData, TafData } from "../types/index.js";

const METAR_API_URL = "https://aviationweather.gov/api/data/metar";
const TAF_API_URL = "https://aviationweather.gov/api/data/taf";
const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Validates and normalizes ICAO codes
 * @throws Error if validation fails
 */
export function validateMetarIcaoCodes(icaoCodes: string[]): string[] {
  if (!Array.isArray(icaoCodes) || icaoCodes.length === 0) {
    throw new Error("icaoCodes must be a non-empty array of valid 4-letter ICAO codes");
  }

  if (icaoCodes.length > 10) {
    throw new Error("Maximum 10 ICAO codes per request");
  }

  const validatedCodes: string[] = [];

  for (const code of icaoCodes) {
    if (typeof code !== "string") {
      throw new Error(`Invalid ICAO code: ${code} (must be a string)`);
    }

    const upperCode = code.toUpperCase().trim();

    // Validate: must be exactly 4 alphabetic characters
    if (!/^[A-Z]{4}$/.test(upperCode)) {
      throw new Error(`Invalid ICAO code format: ${code} (must be 4 alphabetic characters)`);
    }

    validatedCodes.push(upperCode);
  }

  return validatedCodes;
}

/**
 * Fetches METAR data from aviationweather.gov with timeout
 */
async function fetchMetarData(icaoCodes: string[]): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const url = new URL(METAR_API_URL);
    url.searchParams.set("ids", icaoCodes.join(","));
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "SimBrief-MCP-Server/1.0",
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Aviation Weather API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // API returns empty array for no results, or array of METAR objects
    if (!Array.isArray(data)) {
      throw new Error("Invalid response from Aviation Weather API");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Aviation Weather API request timed out (10s)");
      }
      throw error;
    }

    throw new Error("Failed to fetch METAR data");
  }
}

/**
 * Processes raw METAR API response into our format
 */
function processMetarEntry(entry: any): MetarData {
  return {
    icaoId: entry.icaoId,
    name: entry.name || "Unknown",
    rawOb: entry.rawOb || "",
    temp: entry.temp ?? null,
    dewp: entry.dewp ?? null,
    wdir: entry.wdir ?? null,
    wspd: entry.wspd ?? null,
    wgst: entry.wgst ?? null,
    visib: entry.visib ?? null,
    altim: entry.altim ?? null,
    slp: entry.slp ?? null,
    fltCat: entry.fltCat ?? null,
    clouds: Array.isArray(entry.clouds) ? entry.clouds : [],
    lat: entry.lat ?? 0,
    lon: entry.lon ?? 0,
    elev: entry.elev ?? 0,
    reportTime: entry.reportTime || new Date().toISOString(),
  };
}

/**
 * Fetches TAF data from aviationweather.gov with timeout
 */
async function fetchTafData(icaoCodes: string[]): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const url = new URL(TAF_API_URL);
    url.searchParams.set("ids", icaoCodes.join(","));
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "SimBrief-MCP-Server/1.0",
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Aviation Weather API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid TAF response from Aviation Weather API");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Aviation Weather TAF API request timed out (10s)");
      }
      throw error;
    }

    throw new Error("Failed to fetch TAF data");
  }
}

/**
 * Processes raw TAF API response into our format
 */
function processTafEntry(entry: any): TafData {
  return {
    icaoId: entry.icaoId,
    name: entry.name || "Unknown",
    rawTAF: entry.rawTAF || "",
    issueTime: entry.issueTime || new Date().toISOString(),
    validTimeFrom: entry.validTimeFrom,
    validTimeTo: entry.validTimeTo,
    remarks: entry.remarks || null,
    fcsts: Array.isArray(entry.fcsts)
      ? entry.fcsts.map((f: any) => ({
          timeFrom: f.timeFrom,
          timeTo: f.timeTo,
          fcstChange: f.fcstChange || null,
          probability: f.probability || null,
          wdir: f.wdir ?? null,
          wspd: f.wspd ?? null,
          wgst: f.wgst ?? null,
          visib: f.visib ?? null,
          wxString: f.wxString || null,
          clouds: Array.isArray(f.clouds) ? f.clouds : [],
        }))
      : [],
  };
}

/**
 * Main function: Get aviation weather (METAR + optional TAF) for specified airports
 */
export async function getAviationWeather(icaoCodes: string[], includeTaf: boolean = false): Promise<MetarApiResponse> {
  // Validate and normalize input
  const validatedCodes = validateMetarIcaoCodes(icaoCodes);

  // Fetch METAR data (and TAF if requested)
  const [metarData, tafData] = await Promise.all([
    fetchMetarData(validatedCodes),
    includeTaf ? fetchTafData(validatedCodes).catch(() => []) : Promise.resolve([]),
  ]);

  // Create maps of returned data by ICAO code
  const metarMap = new Map<string, any>();
  for (const entry of metarData) {
    if (entry.icaoId) {
      metarMap.set(entry.icaoId.toUpperCase(), entry);
    }
  }

  const tafMap = new Map<string, any>();
  if (includeTaf) {
    for (const entry of tafData) {
      if (entry.icaoId) {
        tafMap.set(entry.icaoId.toUpperCase(), entry);
      }
    }
  }

  // Process each requested airport
  const results: MetarResult[] = validatedCodes.map((icao) => {
    const metarEntry = metarMap.get(icao);
    const tafEntry = tafMap.get(icao);

    if (metarEntry) {
      const result: MetarResult = {
        icao,
        success: true,
        data: processMetarEntry(metarEntry),
      };

      if (includeTaf) {
        result.taf = tafEntry ? processTafEntry(tafEntry) : null;
        if (!tafEntry) {
          result.tafError = "No TAF data available";
        }
      }

      return result;
    } else {
      return {
        icao,
        success: false,
        error: "No METAR data available for this ICAO code",
      };
    }
  });

  return {
    fetchedAt: new Date().toISOString(),
    includeTaf,
    results,
  };
}

/**
 * Formats wind information for display
 */
function formatWind(wdir: number | string | null, wspd: number | null, wgst: number | null): string {
  if (wdir === null || wspd === null) return "N/A";

  const dirStr = typeof wdir === "string" ? wdir : `${wdir}°`;
  let windStr = `${dirStr} at ${wspd}kt`;

  if (wgst !== null && wgst > wspd) {
    windStr += ` gusting ${wgst}kt`;
  }

  return windStr;
}

/**
 * Formats visibility for display
 */
function formatVisibility(visib: string | number | null): string {
  if (visib === null) return "N/A";
  if (typeof visib === "string") return `${visib} SM`;
  return `${visib} SM`;
}

/**
 * Formats temperature for display
 */
function formatTemp(temp: number | null): string {
  if (temp === null) return "N/A";
  return `${temp}°C`;
}

/**
 * Formats a TAF forecast period time
 */
function formatTafTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toUTCString().slice(0, -7) + "Z";
}

/**
 * Formats aviation weather results as markdown
 */
export function formatAviationWeatherMarkdown(response: MetarApiResponse): string {
  let markdown = response.includeTaf ? `### METAR/TAF Results\n\n` : `### METAR Results\n\n`;

  for (const result of response.results) {
    if (result.success && result.data) {
      const data = result.data;
      markdown += `**${data.icaoId}** - ${data.name}\n`;
      markdown += `\`${data.rawOb}\`\n`;
      markdown += `Flight Category: ${data.fltCat || "N/A"} | `;
      markdown += `Temp: ${formatTemp(data.temp)} | `;
      markdown += `Wind: ${formatWind(data.wdir, data.wspd, data.wgst)} | `;
      markdown += `Visibility: ${formatVisibility(data.visib)}\n`;

      // Add TAF if included
      if (response.includeTaf) {
        if (result.taf) {
          markdown += `\n**TAF:**\n`;
          markdown += `\`${result.taf.rawTAF}\`\n`;
          markdown += `Valid: ${formatTafTime(result.taf.validTimeFrom)} to ${formatTafTime(result.taf.validTimeTo)}\n`;
        } else if (result.tafError) {
          markdown += `\n**TAF:** ⚠️ ${result.tafError}\n`;
        }
      }

      markdown += `\n`;
    } else {
      markdown += `**${result.icao}** - ⚠️ ${result.error}\n\n`;
    }
  }

  return markdown.trim();
}

/**
 * Error response helper
 */
export interface AviationWeatherErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function createAviationWeatherErrorResponse(code: string, message: string): AviationWeatherErrorResponse {
  return {
    error: {
      code,
      message,
    },
  };
}
