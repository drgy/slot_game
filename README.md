# Demo Slot Game

## Overview

This project is a web-based slot machine game built with PixiJS and TypeScript. It features a single slot reel with programmable sequence of symbols, and it's designed to be connected to a backend service in the future.

## Technical Implementation

### Architecture

The project follows an object-oriented approach with clear separation of concerns:

- `SlotGame`: Main application class that initializes the game and listens to user input
- `Reel`: Manages the reel animation, symbol positioning, and win highlighting
- `ReelSymbol`: Represents individual symbols on the reel
- `SpinButton`: Interactive button that triggers the spin action
- `Player`: Model for the Player, currently stores player's balance

### Technologies Used

- **TypeScript**: For type safety and better code organization
- **PixiJS**: For fast WebGL-based rendering
- **Vite**: For development and build tooling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/slot_game.git
cd slot_game

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
