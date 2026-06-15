import "./style.css";
import { DECKS } from "./game/decks";
import { validateDeck } from "./game/engine";
import { GameController } from "./app/controller";
import { showBootError } from "./ui/boot-error";

/** Log any malformed deck at startup so data regressions are caught early. */
function sanityCheckDecks(): void {
  for (const d of DECKS) {
    const errs = validateDeck(d);
    if (errs.length) console.error(`Deck ${d.id} errors:`, errs);
  }
}

try {
  sanityCheckDecks();
  new GameController().render();
} catch (e) {
  showBootError(e, "boot");
}
