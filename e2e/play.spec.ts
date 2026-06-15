import { expect, test } from "@playwright/test";

test("full playable loop from menu to game over", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#app main[data-screen='home']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Top Trumps" })).toBeVisible();

  await page.getByRole("button", { name: "Choose deck" }).click();
  await expect(page.locator("#app main[data-screen='theme_pick']")).toBeVisible();

  await page.locator(".theme-card").first().click();
  await expect(page.locator("#app main[data-screen='mode_pick']")).toBeVisible();

  /* Choose 2-player pass-and-play so the e2e test can drive both sides */
  await page.getByRole("button", { name: "2 Players" }).click();
  await expect(page.locator("#app main[data-screen='pass_device']")).toBeVisible();

  const maxSteps = 800;
  for (let i = 0; i < maxSteps; i++) {
    const screen = await page.locator("#app main").getAttribute("data-screen");

    if (screen === "game_over") {
      await expect(page.getByRole("heading", { name: /wins/i })).toBeVisible();
      return;
    }

    if (screen === "pass_device") {
      await page.getByRole("button", { name: /I'm Player \d+ — continue/ }).click();
      continue;
    }

    if (screen === "choose_stat") {
      await page.locator("#app main button.card-stat-row").first().click();
      continue;
    }

    if (screen === "reveal_prompt") {
      await page.getByRole("button", { name: /show my card/ }).click();
      continue;
    }

    if (screen === "opponent_view") {
      await page.getByRole("button", { name: "Reveal round result" }).click();
      continue;
    }

    if (screen === "round_result") {
      const finish = page.getByRole("button", { name: "Finish" });
      const next = page.getByRole("button", { name: "Next round" });
      if ((await finish.count()) > 0 && (await finish.isVisible())) {
        await finish.click();
      } else {
        await next.click();
      }
      continue;
    }

    throw new Error(`Unexpected data-screen="${screen}" at step ${i}`);
  }

  throw new Error(`Did not reach game_over within ${maxSteps} UI steps`);
});
