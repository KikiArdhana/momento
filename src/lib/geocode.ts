/**
 * Free geocoding via OpenStreetMap Nominatim — no API key, no account.
 * Turns a location name ("Dieng, Wonosobo") into coordinates so the
 * person never has to think about latitude/longitude.
 *
 * Fair-use notes: we only call this once per album create/edit (never
 * in loops or on keystrokes), which is well within Nominatim's policy.
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = data[0];
    if (!first?.lat || !first.lon) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch {
    // Offline or Nominatim hiccup — the album simply won't get a pin.
    return null;
  }
}