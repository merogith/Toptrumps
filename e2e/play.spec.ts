import { expect, test, type Page } from "@playwright/test";

function randomChoices(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function prepare(page: Page) {
  await page.clock.install({ time: new Date(42) });
  await page.addInitScript(() => {
    Date.now = () => 42;
    // Fixed opening deal, then reproducible Easy-bot decisions.
    let first = true;
    let seed = 42;
    Math.random = () => {
      if (first) {
        first = false;
        return 0;
      }
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
}

async function finishMatch(page: Page, bot: boolean) {
  const random = randomChoices(42);
  for (let i = 0; i < 5000; i++) {
    if (bot) await page.clock.runFor(1500);
    const screen = await page.locator("#app main").getAttribute("data-screen");
    if (screen === "game_over") {
      await expect(page.getByRole("heading", { name: /wins/i })).toBeVisible();
      await expect(page.getByText(/collected all 30 cards/)).toBeVisible();
      await expect(page.locator("#app main")).toBeFocused();
      return;
    }
    if (screen === "pass_device") {
      if (!bot) await page.getByRole("button", { name: /I'm Player \d+ — continue/ }).click();
    } else if (screen === "choose_stat") {
      const rows = page.locator("#app main button.card-stat-row");
      const count = await rows.count();
      if (count) {
        const counts = (await page.locator(".hud-count").allTextContents()).map(Number);
        const kitty = (await page.locator(".hud-kitty").allTextContents()).join("").match(/\d+/);
        expect(counts.reduce((a, b) => a + b, 0) + Number(kitty?.[0] ?? 0)).toBe(30);
        await rows.nth(Math.floor(random() * count)).click();
      }
    } else if (screen === "reveal_prompt") {
      if (!bot) await page.getByRole("button", { name: /show my card/ }).click();
    } else if (screen === "opponent_view") {
      const reveal = page.getByRole("button", { name: "Reveal round result" });
      if (await reveal.count()) await reveal.click();
    } else if (screen === "round_result") {
      await page.getByRole("button", { name: /Next round|Finish match/ }).click();
    } else {
      throw new Error(`Unexpected screen ${screen}`);
    }
  }
  throw new Error("Seeded match did not finish within its UI step budget");
}

test("full pass-and-play match conserves cards and rematches", async ({ page }) => {
  await prepare(page);
  await page.getByRole("button", { name: "Choose deck", exact: true }).click();
  await page.locator(".theme-card").filter({ hasText: "Star Wars" }).click();
  await page.evaluate(() => {
    Date.now = () => 42;
    Math.random = () => 0;
  });
  await page.getByRole("button", { name: "2 Players" }).click();
  await finishMatch(page, false);
  await page.getByRole("button", { name: "Rematch (same deck)", exact: true }).click();
  await expect(page.locator("#app main")).toHaveAttribute("data-screen", "pass_device");
  await expect(page.locator(".hud-count")).toHaveText(["15", "15"]);
});

test("one-click bot match works on a phone and offers rematch", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await expect(page.locator("#app main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Play Field Lab vs Easy bot" })).toBeFocused();
  await page.keyboard.press("Enter");
  await finishMatch(page, true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Rematch (same deck)", exact: true }).click();
  await page.clock.runFor(10);
  await expect(page.locator("#app main")).toHaveAttribute("data-screen", "choose_stat");
  await expect(page.locator(".hud-count")).toHaveText(["15", "15"]);
  await expect(page.locator(".hud-theme")).toContainText("Easy");
});
