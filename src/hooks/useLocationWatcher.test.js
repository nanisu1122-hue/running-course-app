import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocationWatcher } from "./useLocationWatcher.js";
import {
  stopWatchingLocation,
  watchCurrentLocation,
} from "../API/location.js";

vi.mock("../API/location.js", () => ({
  stopWatchingLocation: vi.fn(),
  watchCurrentLocation: vi.fn(),
}));

describe("useLocationWatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();//呼び出し履歴だけリセット
  });

  it("enabled=trueの場合に位置情報を受け取り、監視を開始する", () => {
    const location = { latitude: 35.6812, longitude: 139.7671 };
    watchCurrentLocation.mockImplementation((onSuccess) => {//mockImplementationは処理内容をあとからぶち込む
      onSuccess(location);
      return 10;
    });

    //｛ result ｝→ stateの変化を逃がさない／renderHookはフックを実行するための使い捨てコンポーネント
    const { result } = renderHook(() => useLocationWatcher(true));

    expect(watchCurrentLocation).toHaveBeenCalledTimes(1);
    expect(result.current.currentLocation).toEqual(location);
  });

  it("enabled=falseへの変更時に監視を解除し、その後のアンマウントで二重解除されないこと", () => {
    watchCurrentLocation.mockReturnValue(10);//mockReturn返す固定値を設定する
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useLocationWatcher(enabled),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });

    expect(stopWatchingLocation).toHaveBeenCalledWith(10);

    stopWatchingLocation.mockClear();
    unmount();
    expect(stopWatchingLocation).not.toHaveBeenCalled();
  });

  it("resetLocationで現在地をリセットする", () => {
    const location = { latitude: 35.6812, longitude: 139.7671 };
    watchCurrentLocation.mockImplementation((onSuccess) => {
      onSuccess(location);
      return 10;
    });
    const { result } = renderHook(() => useLocationWatcher(true));

    act(() => {
      result.current.resetLocation();
    });

    expect(result.current.currentLocation).toBeNull();
    expect(stopWatchingLocation).not.toHaveBeenCalled();
  });

  it("監視エラーを通知し、アンマウント時に返却された監視IDを解除する", () => {
    const watchError = new Error("watch failed");
    const onError = vi.fn();
    watchCurrentLocation.mockImplementation((_onSuccess, onWatchError) => {
      onWatchError(watchError);
      return 10;
    });
    const { unmount } = renderHook(() => useLocationWatcher(true, onError));

    expect(onError).toHaveBeenCalledWith(watchError);

    unmount();
    expect(stopWatchingLocation).toHaveBeenCalledWith(10);
  });
});
