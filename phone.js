import { parsePhoneNumberFromString } from "libphonenumber-js/max";

// Valide et normalise un numéro (format international, pays, type de ligne).
// Ne révèle AUCUNE identité : c est seulement de l analyse technique.
export function analysePhone(raw, defaultCountry) {
  const p = parsePhoneNumberFromString(String(raw), defaultCountry || undefined);
  if (!p || !p.isValid()) return null;
  return { e164: p.number, intl: p.formatInternational(), country: p.country || "", type: p.getType() || "" };
}
