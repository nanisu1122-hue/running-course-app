import { useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-polylinedecorator";

function RouteArrows({ routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      return;
    }

    const decorator = L.polylineDecorator(routeCoordinates, {
      patterns: [
        {
          offset: "10%",
          repeat: "15%",
          symbol: L.Symbol.arrowHead({
            pixelSize: 12,
            polygon: false,
            pathOptions: {
              stroke: true,
              color: "#0066cc",
            },
          }),
        },
      ],
    });

    decorator.addTo(map);

    return () => {
      map.removeLayer(decorator);
    };
  }, [map, routeCoordinates]);

  return null;
}

export default RouteArrows;
