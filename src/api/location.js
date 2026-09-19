function createGeolocationError(error = {}) {
  let type = "LOCATION_UNAVAILABLE";
  let message = "現在地を取得できませんでした。";

  if (error.code === 1) {
    type = "LOCATION_PERMISSION_DENIED";
    message =
      "位置情報の利用が許可されていません。ブラウザの設定を確認してください。";
  } else if (error.code === 3) {
    type = "LOCATION_TIMEOUT";
    message = "位置情報の取得がタイムアウトしました。";
  }

  const customError = new Error(message);
  customError.type = type;
  return customError;
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const unsupportedError = new Error(
        "お使いのブラウザは位置情報取得に対応していません。対応ブラウザをご利用ください。",
      );
      unsupportedError.type = "LOCATION_UNSUPPORTED";
      return reject(unsupportedError);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(createGeolocationError(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  });
}

export function watchCurrentLocation(onSuccess, onError) {
  if (!navigator.geolocation) {
    const unsupportedError = new Error(
      "お使いのブラウザは位置情報取得に対応していません。",
    );
    unsupportedError.type = "LOCATION_UNSUPPORTED";
    onError?.(unsupportedError);
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess?.({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      onError?.(createGeolocationError(error));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
    },
  );
}

export function stopWatchingLocation(watchID) {
  if (watchID !== null && watchID !== undefined && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchID);
  }
}
