# Space Trader

A React-based recreation of the classic PalmOS strategy game **Space Trader**, integrated as a packaged app for the BeigeBoxOS environment.

## Project Description

This project aims to replicate the deep trading and combat mechanics of the original Space Trader. Players take the role of a space-faring merchant, navigating a galaxy of 120 solar systems, each with its own tech level, government, and special resources. The goal is to amass wealth through clever trading while dodging pirates, avoiding the law, and upgrading your ship.

### Key Features

- **Dynamic Economy**: Buy low and sell high across a varied galaxy.
- **Varying Systems**: Each system has unique attributes influencing prices and safety.
- **Combat & Encounters**: Encounter pirates and police during interstellar travel.
- **Ship Progression**: Purchase and upgrade ships from the humble Flea to the mighty Wasp.
- **PalmOS Aesthetic**: Styled to match the authentic look and feel of the original PalmOS application.

## Credits & References

This implementation is heavily inspired by and based on the original **Space Trader** for PalmOS, created by **Pieter Spronck**.

- **Original C Source**: [videogamepreservation/spacetrader](https://github.com/videogamepreservation/spacetrader)
- **Official Reference**: Pieter Spronck's original game logic and data values serve as the primary source of truth for this recreation.

For a detailed analysis of the mechanical differences and implementation nuances compared to the original C source, see [ORIGINAL_COMPARISON.md](./ORIGINAL_COMPARISON.md).

## Technical Overview

Built with TypeScript, React, and Zustand for state management. The app is designed to run within any `OsShellProvider` (Win98, WinXP, or PalmOS/KarpOS) by utilizing the `@retro-web/core` shared context.
