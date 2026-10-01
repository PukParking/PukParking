/**
 * Calculates the distance between two geographic coordinates in kilometers (or miles).
 * 
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @param {string} unit - 'km' for kilometers, 'miles' for miles (default: 'km')
 * @returns {number} Distance rounded to two decimal places
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2, unit = 'km') {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const EARTH_RADIUS_KM = 6371;
  const EARTH_RADIUS_MILES = 3958.8;

  const R = unit === 'miles' ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}