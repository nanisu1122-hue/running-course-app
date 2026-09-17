import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function FitRoute({ routeCoordinates, screen }) {
  const map = useMap();

  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      return;
    }
    // 描画サイズを最新化
    map.invalidateSize({ animate: false });
    const bounds = L.latLngBounds(routeCoordinates);
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, routeCoordinates, screen]);

  return null;
}

export default FitRoute;