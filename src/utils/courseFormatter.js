import { decode } from "@googlemaps/polyline-codec";

const PACE_MINUTES_PER_KM = 6;

export function formatRouteToCourse(routeResponse, index, start) {
  const route = routeResponse?.routes?.[0];

  if (!route) {
    throw new Error(`コース${index + 1}の情報がありません。`);
  }
  if (typeof route.geometry !== "string" || route.geometry.length === 0) {
    throw new Error(`コース${index + 1}のルート情報がありません。`);
  }
  if (
    !route.summary ||
    !Number.isFinite(route.summary.distance) ||
    route.summary.distance <= 0
  ) {
    throw new Error(`コース${index + 1}の距離情報がありません。`);
  }

  const distanceKm = route.summary.distance / 1000;
  const totalMinutes = Math.round(distanceKm * PACE_MINUTES_PER_KM);

  return {
    id: `route-${index}`,
    name: `コース${index + 1}`,
    distance: `距離: ${Math.round(route.summary.distance)}m`,
    duration: `時間: ${totalMinutes}分(6分/㎞)`,
    routeCoordinates: decode(route.geometry, 5),
    startLocation: {
      latitude: start.latitude,
      longitude: start.longitude,
    },
  };
}
