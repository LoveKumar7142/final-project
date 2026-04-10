import type { Project } from "../types/contentModels";

const discountCycle = [40, 50, 30, 45] as const;

const currencyByRegion: Record<string, string> = {
  IN: "INR",
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  AU: "AUD",
  NZ: "NZD",
  EU: "EUR",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  PT: "EUR",
  BE: "EUR",
  AT: "EUR",
  CH: "CHF",
  JP: "JPY",
  KR: "KRW",
  SG: "SGD",
  AE: "AED",
  BR: "BRL",
  MX: "MXN",
  ZA: "ZAR",
  CN: "CNY",
};

const exchangeRates: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0097,
  AUD: 0.018,
  CAD: 0.015,
  NZD: 0.019,
  SGD: 0.016,
  AED: 0.044,
  JPY: 1.6,
  KRW: 15.7,
  CNY: 0.09,
  CHF: 0.011,
  BRL: 0.057,
  MXN: 0.22,
  ZAR: 0.21,
};

export function getUserLocale() {
  if (typeof navigator === "undefined") {
    return "en-IN";
  }

  return navigator.languages?.[0] || navigator.language || "en-IN";
}

function getLocaleRegion(locale: string) {
  const match = locale.match(/-([A-Z]{2})$/i);
  return match ? match[1].toUpperCase() : undefined;
}

function getTimeZoneRegion() {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat === "undefined") {
    return undefined;
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lowerTimeZone = timeZone.toLowerCase();

    if (lowerTimeZone.includes("kolkata") || lowerTimeZone.includes("india") || lowerTimeZone.includes("calcutta")) {
      return "IN";
    }
    if (lowerTimeZone.includes("london")) {
      return "GB";
    }
    if (lowerTimeZone.includes("paris") || lowerTimeZone.includes("berlin") || lowerTimeZone.includes("rome") || lowerTimeZone.includes("amsterdam") || lowerTimeZone.includes("lisbon") || lowerTimeZone.includes("madrid")) {
      return "EU";
    }
    if (lowerTimeZone.includes("new_york") || lowerTimeZone.includes("los_angeles") || lowerTimeZone.includes("chicago") || lowerTimeZone.includes("san_francisco") || lowerTimeZone.includes("miami") || lowerTimeZone.includes("houston")) {
      return "US";
    }
    if (lowerTimeZone.includes("sydney") || lowerTimeZone.includes("melbourne") || lowerTimeZone.includes("brisbane")) {
      return "AU";
    }
    if (lowerTimeZone.includes("tokyo") || lowerTimeZone.includes("osaka")) {
      return "JP";
    }
    if (lowerTimeZone.includes("singapore")) {
      return "SG";
    }
    if (lowerTimeZone.includes("dubai")) {
      return "AE";
    }
    if (lowerTimeZone.includes("beijing") || lowerTimeZone.includes("shanghai") || lowerTimeZone.includes("hong_kong")) {
      return "CN";
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getCurrencyByCountry(countryCode: string) {
  return currencyByRegion[countryCode.toUpperCase()];
}

export async function getCountryCodeFromIp() {
  if (typeof fetch === "undefined") {
    return undefined;
  }

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as { country_code?: string };
    return data.country_code?.toUpperCase();
  } catch {
    return undefined;
  }
}

export function getCurrencyCode(locale: string) {
  const timeZoneRegion = getTimeZoneRegion();
  const localeRegion = getLocaleRegion(locale);
  const region = timeZoneRegion || localeRegion;

  if (region && currencyByRegion[region]) {
    return currencyByRegion[region];
  }

  const language = locale.split("-")[0].toLowerCase();

  if (language === "hi") {
    return "INR";
  }

  if (language === "fr" || language === "de" || language === "es" || language === "it" || language === "nl" || language === "pt") {
    return "EUR";
  }

  return "USD";
}

export function getPricingMeta(project: Project) {
  const currentPrice = Number(project.price || 0);

  if (currentPrice <= 0) {
    return {
      currentPrice: 0,
      originalPrice: 0,
      discountPercent: 0,
      isFree: true,
    };
  }

  const seed = String(project.slug || project.id || project.title || "project");
  const seedTotal = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const discountPercent = discountCycle[seedTotal % discountCycle.length];
  const originalPrice = Math.ceil(currentPrice / (1 - discountPercent / 100));

  return {
    currentPrice,
    originalPrice,
    discountPercent,
    isFree: false,
  };
}

export function formatLocalPrice(price: number, locale = getUserLocale(), currencyOverride?: string) {
  if (price <= 0) {
    return "Free";
  }

  const currency = currencyOverride || getCurrencyCode(locale);
  const rate = exchangeRates[currency] ?? 1;
  const convertedPrice = Math.round(price * rate * 100) / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(convertedPrice);
  } catch {
    return `INR ${price.toLocaleString("en-IN")}`;
  }
}
