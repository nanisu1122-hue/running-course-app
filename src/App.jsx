import { useCallback, useRef, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import LeftPanel from "./components/LeftPanel";
import CourseDetail from "./components/CourseDetail";
import Map from "./components/Map";
import { searchRoute } from "./api/ors";
import { getCurrentLocation } from "./api/location";
import { formatRouteToCourse } from "./utils/courseFormatter";
import { getSearchErrorMessage } from "./utils/errorHandler";
import { useLocationWatcher } from "./hooks/useLocationWatcher";

function App() {
  const [distance, setDistance] = useState(5);
  const [screen, setScreen] = useState("search");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState(null);

  const isSearchingRef = useRef(false);

  const mapCourse =
    screen === "detail" ? selectedCourse : screen === "courses" ? courses[0] : null;
  const mapRouteCoordinates = mapCourse?.routeCoordinates ?? [];
  const mapStartLocation = mapCourse?.startLocation ?? null;

  const handleLocationWatchError = useCallback((error) => {
    setError(getSearchErrorMessage(error));
    setScreen("error");
  }, []);

  const isTrackingActive = screen === "courses" || screen === "detail";

  const {
    currentLocation,
    setInitialLocation,
    resetLocation,
  } = useLocationWatcher(isTrackingActive, handleLocationWatchError);

  async function handleSearch() {
    if (isSearchingRef.current) return;
    isSearchingRef.current = true;

    setScreen("loading");

    try {
      const start = await getCurrentLocation();

      const routes = [];
      for (const seed of [1, 2, 3]) {
        const route = await searchRoute(start, distance, seed);
        routes.push(route);
      }

      const newCourses = routes.map((routeResponse, index) =>
        formatRouteToCourse(routeResponse, index, start)
      );

      setInitialLocation(start);
      setCourses(newCourses);
      setScreen("courses");
    } catch (error) {
      console.error(error);
      setError(getSearchErrorMessage(error));
      setScreen("error");
    } finally {
      isSearchingRef.current = false;
    }
  }

  function handleDetail(course) {
    if (!course) {
      setError("選択したコース情報が存在しません。");
      setScreen("error");
      return;
    }

    setSelectedCourse(course);
    setScreen("detail");
  }

  function backSearch() {
    setError(null);
    isSearchingRef.current = false;
    resetLocation();
    setCourses([]);
    setSelectedCourse(null);
    setScreen("search");
  }

  return (
    <>
      <Header />
      <div className="app-layout">
        <aside className="left-panel">
          <LeftPanel
            screen={screen}
            distance={distance}
            onDistanceChange={setDistance}
            onSearch={handleSearch}
            courses={courses}
            onDetail={handleDetail}
            error={error}
            onBack={backSearch}
          />
        </aside>

        <main className="detail-panel">
          <CourseDetail
            screen={screen}
            selectedCourse={selectedCourse}
          />
          <Map
            routeCoordinates={mapRouteCoordinates}
            startLocation={mapStartLocation}
            currentLocation={currentLocation}
            screen={screen}
          />
        </main>
      </div>
    </>
  );
}

export default App;
