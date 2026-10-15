import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";
import { getCurrentLocation } from "./api/location";
import { searchRoute } from "./api/ors";

vi.mock("./components/Map", () => ({ default: () => null }));
vi.mock("./api/ors", () => ({ searchRoute: vi.fn() }));
vi.mock("./api/location", () => ({
  getCurrentLocation: vi.fn(),
  watchCurrentLocation: () => null,
  stopWatchingLocation: () => {},
}));

const start = { latitude: 35.6812, longitude: 139.7671 };
const distances = [5000, 8000, 10000];
const minutes = [30, 48, 60];
const routeResponses = distances.map((distance) => ({
  routes: [{
    geometry: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
    summary: { distance },
  }],
}));

function mockSuccessfulRoutes() {
  searchRoute.mockReset();
  routeResponses.forEach((route) => searchRoute.mockResolvedValueOnce(route));
}

function clickSearch() {
  fireEvent.click(screen.getByRole("button", { name: "検索", exact: true }));
}

async function showCourses() {
  clickSearch();
  await screen.findByRole("heading", { name: "コース3", exact: true });
}

function selectCourse(number) {
  // jsdomではPC用とモバイル用の文言がボタン名に含まれる。
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`コース${number}を表示`) }));
}

function backToSearch() {
  fireEvent.click(screen.getByRole("button", { name: "検索画面に戻る" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  getCurrentLocation.mockResolvedValue(start);
  mockSuccessfulRoutes();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('初期画面の表示', () => {
  beforeEach(() => {
    render(<App />)
  });

  it("タイトルの表示", () => {
    expect(screen.getByText("ランニングコース検索アプリ")).toBeInTheDocument()
  });
  it("選択距離の説明の表示", () => {
    expect(screen.getByText("走る距離を選択")).toBeInTheDocument()
  });
  it("選択欄が存在する",() => {
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
  it("選択肢が存在する", () => {
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });
  it("初期値は5km", () => {
    expect(screen.getByRole("combobox")).toHaveValue("5");
  });
  it("検索ボタンが存在する", () => {
    expect(screen.getByRole("button", {name: "検索"})).toBeInTheDocument()
  });
});

describe("主要な画面操作", () => {
  beforeEach(() => {
    render(<App />);
  });

  it("距離を変更すると選択状態と3回の検索APIの引数に反映される", async () => {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "8" } });
    expect(screen.getByRole("combobox")).toHaveValue("8");
    expect(searchRoute).not.toHaveBeenCalled();

    clickSearch();

    await waitFor(() => expect(searchRoute).toHaveBeenCalledTimes(3));
    for (const seed of [1, 2, 3]) {
      // 最初のseedは何回目の呼び出しか
      expect(searchRoute).toHaveBeenNthCalledWith(seed, start, 8, seed);
    }
    await screen.findByRole("heading", { name: "コース3", exact: true });
  });

  it("現在地の取得を待つ間は検索中を表示し、検索フォームを隠す", () => {
    // 取得を未完了にして、待機中の画面を確認する。
    getCurrentLocation.mockReturnValueOnce(new Promise(() => {}));
    clickSearch();

    expect(screen.getByRole("heading", { name: "検索中" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "検索", exact: true })).not.toBeInTheDocument();
    expect(searchRoute).not.toHaveBeenCalled();
  });

  it("検索成功後に3件のコースと基本情報を表示し、検索中表示を終了する", async () => {
    await showCourses();

    const cards = within(screen.getByRole("complementary")).getAllByRole("article");
    expect(cards).toHaveLength(3);
    cards.forEach((card, index) => {
      expect(within(card).getByText(`コース${index + 1}`, { exact: true })).toBeInTheDocument();
      expect(within(card).getByText(`距離: ${distances[index]}m`)).toBeInTheDocument();
      expect(within(card).getByText(`時間: ${minutes[index]}分(6分/㎞)`)).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "検索中" })).not.toBeInTheDocument();
  });

  it("選択したコースの詳細を表示し、別コースへの選択変更を反映する", async () => {
    await showCourses();

    for (const number of [2, 3]) {
      selectCourse(number);
      const detail = within(screen.getByRole("main")).getByRole("article");
      expect(detail).toHaveTextContent(`コース${number}`);
      expect(detail).toHaveTextContent(`距離: ${distances[number - 1]}m`);
      expect(detail).toHaveTextContent(`時間: ${minutes[number - 1]}分(6分/㎞)`);
    }
    expect(within(screen.getByRole("main")).getByRole("article")).not.toHaveTextContent("コース2");
  });

  it("コース一覧から検索画面に戻ると、検索結果を消してフォームを表示する", async () => {
    await showCourses();
    backToSearch();

    expect(screen.getByRole("combobox")).toHaveValue("5");
    expect(screen.getByRole("button", { name: "検索", exact: true })).toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { name: /^コース[123]$/ })).toHaveLength(0);
  });

  it("詳細から戻ると距離を維持して詳細を消し、再検索後は一覧を表示する", async () => {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "8" } });
    await showCourses();
    selectCourse(2);
    backToSearch();

    expect(screen.getByRole("combobox")).toHaveValue("8");
    expect(within(screen.getByRole("main")).queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { name: /^コース[123]$/ })).toHaveLength(0);

    mockSuccessfulRoutes();
    await showCourses();
    expect(screen.getAllByRole("heading", { name: /^コース[123]$/ })).toHaveLength(3);
    expect(within(screen.getByRole("main")).queryByRole("article")).not.toBeInTheDocument();
    expect(searchRoute).toHaveBeenCalledTimes(3);
    expect(searchRoute).toHaveBeenCalledWith(start, 8, 1);
  });

  it("位置情報取得の失敗を表示し、APIを呼ばず検索画面に戻れる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = "位置情報の利用が許可されていません。ブラウザの設定を確認してください。";
    getCurrentLocation.mockRejectedValueOnce(Object.assign(new Error(message), {
      type: "LOCATION_PERMISSION_DENIED",
    }));
    clickSearch();

    await screen.findByRole("heading", { name: message, exact: true });
    expect(searchRoute).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "検索中" })).not.toBeInTheDocument();
    backToSearch();
    expect(screen.getByRole("button", { name: "検索", exact: true })).toBeInTheDocument();
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it("API通信の失敗を表示し、検索画面に戻って再検索できる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    searchRoute.mockReset().mockRejectedValueOnce(Object.assign(new Error("通信失敗"), {
      type: "SERVER_STOPPED",
    }));
    clickSearch();

    const message = "APIサーバーに接続できません。サーバーの起動状態を確認してください。";
    await screen.findByRole("heading", { name: message, exact: true });
    expect(screen.queryAllByRole("heading", { name: /^コース[123]$/ })).toHaveLength(0);
    expect(screen.queryByRole("heading", { name: "検索中" })).not.toBeInTheDocument();
    backToSearch();
    expect(screen.getByRole("combobox")).toHaveValue("5");
    expect(screen.queryByText(message)).not.toBeInTheDocument();

    mockSuccessfulRoutes();
    await showCourses();
    expect(screen.getAllByRole("heading", { name: /^コース[123]$/ })).toHaveLength(3);
    expect(searchRoute).toHaveBeenCalledTimes(3);
  });
});
