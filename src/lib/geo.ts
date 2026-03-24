/**
 * Calculate the Haversine distance between two geographic points.
 * Returns distance in kilometers.
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Format a year integer to display string (e.g., -500 → "500 BC", 1776 → "1776 AD")
 */
export function formatYear(year: number): string {
    if (year < 0) return `${Math.abs(year)} BC`;
    if (year === 0) return "1 BC";
    return `${year} AD`;
}
