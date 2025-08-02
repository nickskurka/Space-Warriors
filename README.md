# Space Warriors

A 2D space shooter game built with Python and Pygame featuring physics-based movement, enemy AI, powerups, and dynamic gameplay.

## Features

- **Physics-based movement** with momentum and rotational inertia
- **Intelligent enemy AI** that spawns around the player and pursues them
- **Projectile combat system** with collision detection
- **Triple-shot powerup** with visual timer indicator
- **Dynamic camera system** that follows the player
- **Minimap** showing player and enemy positions
- **Health system** with visual health bars
- **Scoring system** based on damage dealt and enemies destroyed
- **Background star field** for visual depth
- **Game over screen** with restart functionality

## Requirements

- Python 3.7+
- pygame 2.0+

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd SpaceWarriors
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the game:
```bash
python main.py
```

## Controls

- **WASD** or **Arrow Keys**: Move and rotate your ship
- **Spacebar**: Fire projectiles
- **R**: Restart game (when game over)
- **ESC**: Quit game

## Gameplay

- Survive waves of enemies that spawn around you
- Collect cyan powerups to activate triple-shot mode
- Enemies get larger and stronger over time
- Score points by dealing damage and destroying enemies
- Use momentum-based physics to your advantage

## Project Structure

```
SpaceWarriors/
├── main.py          # Entry point and game initialization
├── game.py          # Main game logic and rendering
├── entities.py      # Game object classes (Player, Enemy, etc.)
├── config.py        # Constants and configuration
├── requirements.txt # Python dependencies
├── player.png       # Player sprite image
├── enemy_bat.png    # Enemy sprite image
├── index.html       # Web version (HTML5 Canvas)
├── game.js          # Web version (JavaScript)
└── style.css        # Web version (CSS)
```

## Development

The codebase is organized into modular components:

- **config.py**: All game constants and configuration values
- **entities.py**: Game object classes with their own update and draw methods
- **game.py**: Main game loop, collision detection, and rendering
- **main.py**: Clean entry point for the application

## Web Version

This project also includes a complete HTML5/JavaScript port that runs in web browsers with identical functionality. Open `index.html` in a modern web browser to play the web version.

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
