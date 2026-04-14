# BeigeBoxOS

BeigeBoxOS is a monorepo of retro-web desktops and applications, built with React, Next.js, and TypeScript. It provides a collection of authentic operating system simulations, each with its own unique aesthetic, shell, and application suite.

## The Operating Systems

BeigeBoxOS features several distinct desktop environments:

- **[Windows 98](./os/win98)**: A faithful recreation of the seminal 1998 Microsoft OS, complete with the classic taskbar, start menu, and iconic grey-3D aesthetic. Includes apps like Minesweeper, Word, and Netscape.
- **[Windows XP](./os/winxp)**: The colorful "Luna" experience of early 2000s computing. Features the signature blue taskbar and green start button.
- **[PalmOS](./os/palmos)**: A hardware-level simulation of a Palm m505 handheld. Includes the authentic "Silk Area" for inputs and the classic suite of PIM apps (Address, Date Book, etc.), plus a recreation of the strategy game Space Trader.
- **[KarpOS](./os/karpos)**: A personal playground shell with a neo-brutalist theme. It features a macOS-style applications grid and serves as a testing ground for modern takes on retro interactions.
- **[MacOS Tiger](./os/macosx-tiger)**: (In development) An Aqua-themed recreation of Apple's mid-2000s desktop experience.

## Monorepo Structure

- **`os/`**: Individual Next.js applications for each desktop environment.
- **`packages/core/`**: Shared TypeScript logic, types, and shell contexts (e.g., `OsShellProvider`).
- **`packages/apps/`**: Standalone, themeable applications that can be shared across multiple OS environments (e.g., `@retro-web/app-minesweeper`).

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm

### Installation

```bash
pnpm install
```

### Development

To run a specific OS environment:

```bash
# Start Windows 98
pnpm dev:win98

# Start KarpOS
pnpm dev:karpos

# Start PalmOS
pnpm dev:palmos
```

## Running Tests

We use Playwright for end-to-end testing across the different environments.

```bash
# Run all tests
npm run e2e

# Run specific OS tests (e.g., PalmOS Space Trader)
npx playwright test e2e/os/palmos/spacetrader --project=palmos-chromium
```

## Credits

BeigeBoxOS integrates various third-party logic and assets. See the README files in individual `packages/apps/` for specific credits (e.g., the [Space Trader README](./packages/apps/space-trader/README.md)).
