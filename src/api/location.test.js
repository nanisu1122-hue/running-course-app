import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getCurrentLocation,
  watchCurrentLocation,
  stopWatchingLocation,
} from "./location.js";

describe("位置情報取得テスト", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("navigator.geolocation が存在しない場合はLOCATION_UNSUPPORTEDを返すこと", async () => {
    vi.stubGlobal("navigator", {});

    await expect(getCurrentLocation()).rejects.toMatchObject({
      type: "LOCATION_UNSUPPORTED",
    });
  });

  it("現在地を取得できた場合は緯度と経度を返すこと", async () => {
    const getCurrentPositionMock = vi.fn((success) => {
      success({
        coords: {
          latitude: 35.6812,
          longitude: 139.7671,
        },
      });
    });
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: getCurrentPositionMock,
      },
    });

    await expect(getCurrentLocation()).resolves.toEqual({
      latitude: 35.6812,
      longitude: 139.7671,
    });

    expect(getCurrentPositionMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  });

  it("位置情報の利用が拒否された場合はLOCATION_PERMISSION_DENIEDを返すこと", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }),
      },
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({
      type: "LOCATION_PERMISSION_DENIED",
    });
  });

  it("位置情報の取得がタイムアウトした場合はLOCATION_TIMEOUTを返すこと", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 3,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }),
      },
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({
      type: "LOCATION_TIMEOUT",
    });
  });

  it("位置情報が取得できない環境の場合はLOCATION_UNAVAILABLEを返すこと", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 2,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }),
      },
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({
      type: "LOCATION_UNAVAILABLE",
    });
  });

  it("stopWatchingLocationが渡されたwatchIdでclearWatchを正しく呼び出すこと", () => {
    const clearWatchMock = vi.fn();
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch: clearWatchMock,
      },
    });

    const targetWatchId = 123;
    stopWatchingLocation(targetWatchId);

    expect(clearWatchMock).toHaveBeenCalledTimes(1);
    expect(clearWatchMock).toHaveBeenCalledWith(targetWatchId);
  });

  it("stopWatchingLocationにnullが渡された場合はclearWatchを呼び出さないこと", () => {
    const clearWatchMock = vi.fn();
    vi.stubGlobal("navigator", {
      geolocation: {
        clearWatch: clearWatchMock,
      },
    });

    stopWatchingLocation(null);

    expect(clearWatchMock).not.toHaveBeenCalled();
  });

  it("watchCurrentLocationが成功時にコールバックへ位置情報を渡すこと", () => {
    const successCallback = vi.fn();
    const errorCallback = vi.fn();
    const mockWatchId = 99;

    vi.stubGlobal("navigator", {
      geolocation: {
        watchPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 35.6812,
              longitude: 139.7671,
            },
          });
          return mockWatchId;
        }),
      },
    });

    const watchId = watchCurrentLocation(successCallback, errorCallback);

    expect(watchId).toBe(mockWatchId);
    expect(successCallback).toHaveBeenCalledWith({
      latitude: 35.6812,
      longitude: 139.7671,
    });
    expect(errorCallback).not.toHaveBeenCalled();
  });

  it("watchCurrentLocationで監視エラー時にエラーコールバックが呼ばれること", () => {
    const successCallback = vi.fn();
    const errorCallback = vi.fn();

    vi.stubGlobal("navigator", {
      geolocation: {
        watchPosition: vi.fn((_success, error) => {
          error({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
          return 100;
        }),
      },
    });

    watchCurrentLocation(successCallback, errorCallback);

    expect(successCallback).not.toHaveBeenCalled();
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(
      expect.objectContaining({ type: "LOCATION_PERMISSION_DENIED" }),
    );
  });

  it("watchCurrentLocationで位置情報が未対応の場合はエラーコールバックを呼ぶこと", () => {
    const successCallback = vi.fn();
    const errorCallback = vi.fn();
    vi.stubGlobal("navigator", {});

    const watchId = watchCurrentLocation(successCallback, errorCallback);

    expect(watchId).toBeNull();
    expect(successCallback).not.toHaveBeenCalled();
    expect(errorCallback).toHaveBeenCalledWith(
      expect.objectContaining({ type: "LOCATION_UNSUPPORTED" }),
    );
  });
});
