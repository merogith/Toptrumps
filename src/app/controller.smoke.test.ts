// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameController } from "./controller";
import { newGame } from "../game/engine";
import { DECKS } from "../game/decks";
import { mulberry32 } from "../game/rng";

function screen(): string | undefined {
  return document.querySelector<HTMLElement>("#app main")?.dataset.screen;
}
function clickPrimary(): void {
  document.querySelector<HTMLButtonElement>("#app main .btn-primary")?.click();
}
function clickNamed(label: string): void {
  const button = [...document.querySelectorAll<HTMLButtonElement>("#app button")].find(
    (b) => b.textContent === label,
  );
  expect(button).toBeTruthy();
  button!.click();
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  window.scrollTo = () => {};
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("controller (DOM)", () => {
  it("boots with a keyboard focus target and keeps the deck picker available", () => {
    new GameController().render();
    expect(screen()).toBe("home");
    expect(document.querySelector("#app h1")?.textContent).toBe("Top Trumps");
    expect(document.activeElement).toBe(document.querySelector("#app main"));
    clickNamed("Choose deck");
    expect(screen()).toBe("theme_pick");
    expect(document.activeElement).toBe(document.querySelector("#app main"));
  });

  it("starts the original deck against Easy in one click", () => {
    vi.useFakeTimers();
    const controller = new GameController();
    controller.render();
    clickNamed("Play Field Lab vs Easy bot");
    vi.advanceTimersByTime(10);
    expect(screen()).toBe("choose_stat");
    expect(controller.game.theme?.id).toBe("field-lab");
    expect(controller.game.bot).toEqual({ player: 2, difficulty: "easy" });
    expect(document.querySelectorAll("button.card-stat-row")).toHaveLength(6);
    controller.clearBotTimer();
  });

  it.each([false, true])(
    "plays a complete %s bot-mode match, then rematches with the same mode",
    (botMode) => {
      vi.useFakeTimers();
      const random = mulberry32(42);
      vi.spyOn(Math, "random").mockImplementation(random);
      const controller = new GameController();
      controller.game = newGame(DECKS[0], 42, botMode ? { player: 2, difficulty: "easy" } : null);
      controller.render();
      for (let step = 0; step < 10000 && screen() !== "game_over"; step++) {
        if (botMode) vi.advanceTimersByTime(1500);
        switch (screen()) {
          case "pass_device":
          case "reveal_prompt":
          case "opponent_view":
          case "round_result":
            clickPrimary();
            break;
          case "choose_stat": {
            const rows = document.querySelectorAll<HTMLButtonElement>(
              "#app main button.card-stat-row",
            );
            if (rows.length) rows[Math.floor(random() * rows.length)].click();
            break;
          }
        }
        const { p1, p2, kitty } = controller.game;
        expect(new Set([...p1, ...p2, ...kitty].map((c) => c.id)).size).toBe(30);
      }
      expect(screen()).toBe("game_over");
      expect(document.querySelector("#app h1")?.textContent).toContain("wins");
      expect(Math.max(controller.game.p1.length, controller.game.p2.length)).toBe(30);
      const bot = controller.game.bot;
      clickNamed("Rematch (same deck)");
      expect(controller.game.bot).toEqual(bot);
      expect(controller.game.p1).toHaveLength(15);
      expect(controller.game.p2).toHaveLength(15);
      controller.clearBotTimer();
    },
    15000,
  );
});
