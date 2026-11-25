[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/doms99999/mie-kilat/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/doms99999/mie-kilat/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# MIE KILAT — Lightning Noodles

A complete, original cooking game for make.fun's **best-cooking-game-20261125-0137** bounty ($250, 10 paid places). You run the fastest noodle cart in town: orders land on the ticket rail with a patience bar, you cook noodle nests in the pot, scoop them into the bowl, add toppings to match the recipe, and ring the bell to serve — before the customer walks away.

## How to play

- **Click a ticket** on the order board to make it active.
- **Click the pot (or press N)** to drop a noodle nest in. It is perfect at 5–7 seconds (green ring), burnt at 9.
- **Click the bowl (or press S)** to scoop a ready nest into the bowl.
- **Click a topping bin (or press 1–7)** to add it: Ayam, Bakso, Telur, Sawi, Cabai, Bawang, Kerupuk.
- **Click the bell (or press Space)** to serve. An exact recipe with perfect noodles pays 1.5x and grows your combo.
- **P** pauses, **R** restarts. One shift lasts 150 seconds; lunch rush at 0:55 and dinner rush at 1:45 tighten the orders.

Six original recipes: Mie Ayam Kilat, Mie Bakso Lava, Mie Telur Matahari, Mie Komplit Raja, Mie Sawi Segar, Mie Pedas Nampol. All art is drawn in code (no images), all sounds are synthesized with WebAudio — nothing is copied from any commercial game.

## Run it

```sh
# any static server, e.g.
python3 -m http.server 8080 --directory game
# then open http://localhost:8080
```

Screenshots are deterministic renders of the game's own code: `game/src/shots.js` stages four states (`?shot=start|play|rush|serve&seed=1`).

## Hand-in

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts` (the kit's copy, unchanged).

## Development notes

The game was built in one recorded session: research first (kit rules, the judge's screenshot-first criteria, and the winning pattern from best-game-01's top entries — one memorable mechanic plus visible progression), then the code, then a visual pass. The core loop was verified in Node before screenshots were taken: cook 6s → ready → scoop → three toppings → perfect serve pays 2,533 coins and starts a combo, and the shift ends cleanly at 150s. Screenshots were re-shot after two fixes — the pot's ready hint went from per-nest to one shared line, and the rush banner was shortened so it never covers a panel header. Both runs of `main.ts` produce byte-identical output.

## v2 — post-submit revision (audit-driven)

The post-build audit caught one real soft-lock: burnt nests could never leave the pot, so three burns bricked cooking for the rest of the shift. v2 fixes it — click a burnt nest to discard it — and adds topping toggle (click a topping in the bowl to take it back out) plus a BUANG (X) button that dumps the bowl, so a misclick never forces a 0.6x serve. The serve popup moved to a dark pill above the bell, the CEPAT! urgent label is now solid on a dark pill instead of a pulsing alpha (it vanished in the rush screenshot), screenshot time is frozen so re-shoots are reproducible, and the dead `p226` stub and `void ring` are gone. All four screenshots were re-shot and re-verified after the fixes.
