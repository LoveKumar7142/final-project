import { useEffect, useMemo, useState } from "react";
import {
  getCurrencyByCountry,
  getCountryCodeFromIp,
  getCurrencyCode,
  getUserLocale,
} from "../lib/pricing";

export function useCurrency() {
  const locale = useMemo(() => getUserLocale(), []);
  const [currency, setCurrency] = useState(() => getCurrencyCode(locale));

  useEffect(() => {
    let active = true;

    async function resolveCurrency() {
      const countryCode = await getCountryCodeFromIp();
      if (!active || !countryCode) {
        return;
      }

      const geoCurrency = getCurrencyByCountry(countryCode);
      if (geoCurrency && geoCurrency !== currency) {
        setCurrency(geoCurrency);
      }
    }

    resolveCurrency();

    return () => {
      active = false;
    };
  }, [currency, locale]);

  return { locale, currency };
}
