import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import RouteArrows from "./RouteArrow";
import FitRoute from "./FitRoute.jsx";

// 自動推測メソッドの無効化
delete L.Icon.Default.prototype._getIconUrl;
// 画像パスの上書き
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function Map({
  routeCoordinates,
  startLocation,
  currentLocation,
  screen,
}) {
  return (
    <MapContainer
      center={[35.681236, 139.767125]}
      zoom={15}
      zoomSnap={0.25}
      zoomDelta={0.25}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        // クレジット表示
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://openrouteservice.org/">openrouteservice.org by HeiGIT</a>'
        // {z} や {x} や {y} はLeafletが適切な値に置き換える。
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={routeCoordinates} />
      <RouteArrows routeCoordinates={routeCoordinates} />
      <FitRoute
        routeCoordinates={routeCoordinates}
        screen={screen}
      />
      {startLocation && (
        <Marker position={[startLocation.latitude, startLocation.longitude]} />
      )}
      {currentLocation && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
        />
      )}
    </MapContainer>
  );
}

export default Map;
