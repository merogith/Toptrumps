// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "./controller";

/**
 * Headless DOM smoke test. Mounts the real controller and clicks through a
 * full 2-player match the way the browser e2e test does — proving every screen
 * module renders and wires up without a real browser.
 */

function screen(): string | undefined {
  return document.querySelector<HTMLElement>("#app main")?.dataset.screen;
}

function clickPrimary(): void {
  document.querySelector<HTMLButtonElement>("#app main .btn-primary")?.click();
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  // happy-dom doesn't implement scrollTo; the controller calls it every render.
  window.scrollTo = () => {};
});

describe("controller (DOM)", () => {
  it("boots on the home screen", () => {
    new GameController().render();
    expect(screen()).toBe("home");
    expect(document.querySelector("#app h1")?.textContent).toBe("Top Trumps");
  });

  it("plays a full 2-player match to game over", () => {
    new GameController().render();

    document.querySelector<HTMLButtonElement>("#app .btn-primary")?.click(); // Choose deck
    expect(screen()).toBe("theme_pick");

    document.querySelector<HTMLButtonElement>("#app .theme-card")?.click();
    expect(screen()).toBe("mode_pick");

    document.querySelector<HTMLButtonElement>("#app .mode-2p-btn")?.click();
    expect(screen()).toBe("pass_device");

    for (let i = 0; i < 2000; i++) {
      const s = screen();
      if (s === "game_over") {
        const heading = document.querySelector("#app h1")?.textContent ?? "";
        expect(heading.toLowerCase()).toContain("win");
        return;
      }
      switch (s) {
        case "pass_device":
        case "reveal_prompt":
        case "opponent_view":
        case "round_result":
          clickPrimary();
          break;
        case "choose_stat":
          document.querySelector<HTMLButtonElement>("#app main button.card-stat-row")?.click();
          break;
        default:
          throw new Error(`Unexpected screen "${s}" at step ${i}`);
      }
    }
    throw new Error("Did not reach game_over within step budget");
  });
});
