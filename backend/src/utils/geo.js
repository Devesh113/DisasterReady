/**
 * Geospatial utility module for DisasterReady.
 * Implements Haversine distance formula, bounding box calculations,
 * and coordinate validation without external C-bindings or PostGIS dependencies.
 */

const EARTH_RADIUS_KM = 6371.0;

/**
 * Validate latitude and longitude values
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @returns {boolean}
 */
const isValidCoordinates = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

/**
 * Validate radius value
 * @param {number} radiusKm - Radius in kilometres
 * @returns {boolean}
 */
const isValidRadius = (radiusKm) => {
  if (typeof radiusKm !== 'number' || isNaN(radiusKm)) return false;
  return radiusKm > 0 && Number.isFinite(radiusKm);
};

/**
 * Calculate Great-Circle distance between two points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometres
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!isValidCoordinates(lat1, lon1) || !isValidCoordinates(lat2, lon2)) {
    throw new Error('Invalid coordinates provided to calculateHaversineDistance');
  }

  // Convert decimal degrees to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;

  const radLat1 = (lat1 * Math.PI) / 180.0;
  const radLat2 = (lat2 * Math.PI) / 180.0;

  // Haversine formula
  const a =
    Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate an approximate bounding box around a center point for a given radius.
 * Used for database candidate pre-filtering to avoid loading the entire alerts table into memory.
 *
 * @param {number} centerLat - Center latitude in degrees
 * @param {number} centerLon - Center longitude in degrees
 * @param {number} radiusKm - Search radius in kilometres
 * @returns {{ minLat: number, maxLat: number, minLon: number, maxLon: number }}
 */
const getBoundingBox = (centerLat, centerLon, radiusKm) => {
  if (!isValidCoordinates(centerLat, centerLon)) {
    throw new Error('Invalid center coordinates provided to getBoundingBox');
  }
  if (!isValidRadius(radiusKm)) {
    throw new Error('Invalid radius provided to getBoundingBox');
  }

  // 1 degree of latitude is roughly 111.045 km
  const latDelta = radiusKm / 111.045;
  const minLat = Math.max(-90.0, centerLat - latDelta);
  const maxLat = Math.min(90.0, centerLat + latDelta);

  // 1 degree of longitude depends on latitude
  // Near the poles (lat > 89 or < -89), longitude span covers all longitudes
  let minLon = -180.0;
  let maxLon = 180.0;
  const cosLat = Math.cos((centerLat * Math.PI) / 180.0);

  if (Math.abs(cosLat) > 0.0001) {
    const lonDelta = radiusKm / (111.045 * cosLat);
    minLon = Math.max(-180.0, centerLon - Math.abs(lonDelta));
    maxLon = Math.min(180.0, centerLon + Math.abs(lonDelta));
  }

  return { minLat, maxLat, minLon, maxLon };
};

/**
 * Check if a point is within a circular radius of a center point
 * @param {number} centerLat
 * @param {number} centerLon
 * @param {number} pointLat
 * @param {number} pointLon
 * @param {number} radiusKm
 * @returns {boolean}
 */
const isWithinRadius = (centerLat, centerLon, pointLat, pointLon, radiusKm) => {
  const distance = calculateHaversineDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
};

module.exports = {
  EARTH_RADIUS_KM,
  calculateHaversineDistance,
  getBoundingBox,
  isWithinRadius,
  isValidCoordinates,
  isValidRadius,
};

