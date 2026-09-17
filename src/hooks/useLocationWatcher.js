import { useState, useRef, useEffect, useCallback } from "react";
import { watchCurrentLocation, stopWatchingLocation } from "../API/location";

export function useLocationWatcher(enabled, onError) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const onErrorRef = useRef(onError);

  // 常に最新のエラー処理関数を呼べるようにする
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;
    const watchId = watchCurrentLocation(
      (location) => {
        if (isActive) {
          setCurrentLocation(location);
        }
      },
      (error) => {
        if (!isActive) {
          return;
        }
        console.error("位置情報の監視エラー:", error);
        onErrorRef.current?.(error);
      }
    );

    return () => {
      isActive = false;
      if (watchId !== null) {
        stopWatchingLocation(watchId);
      }
    };
  }, [enabled]);

  const setInitialLocation = useCallback((location) => {
    setCurrentLocation(location);
  }, []);

  const resetLocation = useCallback(() => {
    setCurrentLocation(null);
  }, []);

  return {
    currentLocation,
    setInitialLocation,
    resetLocation,
  };
}
