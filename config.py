"""
Constants and configuration for Space Warriors game.
"""

# Display settings
WIDTH = 1600
HEIGHT = 900
FPS = 60

# Colors (RGB tuples)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
CYAN = (0, 255, 255)

# Game object colors
PLAYER_COLOR = BLUE
PROJECTILE_COLOR = WHITE
ENEMY_COLOR = RED

# Game mechanics
PROJ_SPEED = 25
BACKGROUND_COLOR = (0, 0, 20)

# Spawn intervals (in frames at 60 FPS)
ENEMY_SPAWN_INTERVAL = 180  # 3 seconds
POWERUP_SPAWN_INTERVAL = 600  # 10 seconds

# Scoring
DAMAGE_BONUS = 1
KILL_BONUS = 50

# Powerup duration
TRIPLE_SHOT_DURATION = 600  # 10 seconds at 60 FPS

# Physics constants
PLAYER_MAX_SPEED = 8.0
PLAYER_DECELERATION = 0.98
PLAYER_MAX_ANGULAR_VELOCITY = 4.0
PLAYER_ANGULAR_DECELERATION = 0.92
PLAYER_ANGULAR_ACCELERATION = 0.3

ENEMY_MAX_SPEED = 2.0
ENEMY_DECELERATION = 0.95
ENEMY_VISION_RANGE = 800

# Visual effects
DAMAGE_FLASH_DURATION = 10  # frames
