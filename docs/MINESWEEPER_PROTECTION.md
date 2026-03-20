# Protecting Minesweeper from Cheaters Viewing the Code

The game board (which cells are mines) lives in **React state in the browser**. Anyone can open DevTools, set breakpoints, or inspect the component state and see the full board.

## What you can do

### 1. **Rely on production build (minification)**

`next build` minifies and mangles variable names. So `board`, `isMine`, `cell.isRevealed` become short, opaque names. That raises the bar for casual inspection but does **not** prevent a determined user from finding the board in memory or by tracing the code.

### 2. **Server-authoritative game (only real protection)**

To truly hide mine positions from the client:

- **Server** holds the board (e.g. in memory or DB keyed by game/session).
- **Client** only sends actions: “reveal (x, y)” or “toggle flag (x, y)”.
- **Server** responds with: revealed cells (numbers or “mine”), game state (playing / won / lost), and never sends the full grid.

Then the client never has the full mine map; it only gets what the server chooses to send. Implementing this means:

- New API routes (e.g. “start game”, “reveal”, “flag”).
- Session or game-id handling.
- Possibly moving a lot of logic (flood fill, win check) to the server.

### 3. **What does _not_ work**

- **Obfuscating or encrypting the board in the client** – the client must decrypt to render and handle clicks, so the decrypted board is in memory and can be inspected.
- **Hiding the script** – front-end code is always visible in DevTools (Sources, Network).

## Recommendation

For a nostalgic, low-stakes game, **minification + the existing leaderboard checks** (signed tokens, min time, one token per game) are usually enough. For a competitive or high-stakes setting, implement a **server-authoritative** Minesweeper so the server never sends the full board to the client.
