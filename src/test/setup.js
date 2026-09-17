import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 各テスト終了後に仮想DOMを初期化
afterEach(() => {
  cleanup();
});