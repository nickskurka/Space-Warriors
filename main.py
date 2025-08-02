#!/usr/bin/env python3
"""
Space Warriors - A 2D space shooter game

Entry point for the Space Warriors game. This initializes pygame and starts the main game loop.

Controls:
- WASD or Arrow Keys: Move and rotate
- Space: Shoot
- R: Restart (when game over)
- ESC: Quit

Author: Space Warriors Team
"""

import pygame
from game import Game
from config import WIDTH, HEIGHT, FPS


def main():
    """Initialize pygame and start the game."""
    pygame.init()
    pygame.display.set_caption("Space Warriors")

    # Create and run the game
    game = Game(WIDTH, HEIGHT, FPS)
    game.run()


if __name__ == "__main__":
    main()
