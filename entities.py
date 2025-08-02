"""
Game entities for Space Warriors: Player, Enemy, Projectile, Powerup, and Star classes.
"""

import math
import random
import pygame
from config import *


class Star:
    """Background star for visual effect."""

    def __init__(self, world_pos):
        self.world_pos = pygame.Vector2(world_pos)
        self.radius = random.randint(1, 3)

    def draw(self, surface, camera_offset):
        # Convert world position to screen position using camera offset
        screen_pos = self.world_pos - camera_offset
        # Only draw if on screen (with some margin)
        if -50 < screen_pos.x < WIDTH + 50 and -50 < screen_pos.y < HEIGHT + 50:
            pygame.draw.circle(surface, YELLOW, (int(screen_pos.x), int(screen_pos.y)), self.radius)


class Char:
    """Player character class with physics-based movement and sprite rendering."""

    # Class variable to store the loaded image (shared by all players)
    player_image = None

    def __init__(self, color, size, pos, vel, angle=0):
        self.color = color
        self.original_size = pygame.Vector2(size)  # Keep original for collision detection
        self.pos = pygame.Vector2(pos)
        self.vel = pygame.Vector2(vel)
        self.angle = angle  # in degrees
        self.max_speed = PLAYER_MAX_SPEED
        self.deceleration = PLAYER_DECELERATION
        self.shooting_velocity = 5
        self.health = 100
        self.max_health = 100

        # Rotational physics
        self.angular_velocity = 0.0
        self.max_angular_velocity = PLAYER_MAX_ANGULAR_VELOCITY
        self.angular_deceleration = PLAYER_ANGULAR_DECELERATION
        self.angular_acceleration = PLAYER_ANGULAR_ACCELERATION

        # Load the player image if not already loaded
        if Char.player_image is None:
            try:
                Char.player_image = pygame.image.load("player.png").convert_alpha()
            except pygame.error as e:
                print(f"Could not load player.png: {e}")
                Char.player_image = None

        # Set up sprite properties (16x15 sprite facing right)
        if Char.player_image is not None:
            self.sprite_size = (16, 15)  # Original sprite dimensions
            # Scale up the sprite to be 4x bigger
            self.scaled_size = (64, 60)  # 4x scale: 16*4=64, 15*4=60
            self.scaled_image = pygame.transform.scale(Char.player_image, self.scaled_size)
            self.size = pygame.Vector2(self.scaled_size)  # Update size for collision
        else:
            self.size = self.original_size  # Fallback to original triangle size

        # Power-up state
        self.triple_shot_active = False
        self.triple_shot_timer = 0

    def update(self):
        # Apply deceleration (friction) to gradually slow down
        self.vel *= self.deceleration

        # Stop very small velocities to prevent infinite drift
        if self.vel.length() < 0.01:
            self.vel = pygame.Vector2(0, 0)

        # Apply angular deceleration (rotational friction)
        self.angular_velocity *= self.angular_deceleration

        # Stop very small angular velocities to prevent infinite rotation
        if abs(self.angular_velocity) < 0.01:
            self.angular_velocity = 0.0

        # Apply the angular velocity to the angle
        self.angle += self.angular_velocity

        # Move in the current velocity direction
        self.pos += self.vel

        # Update power-up states
        if self.triple_shot_active:
            self.triple_shot_timer -= 1
            if self.triple_shot_timer <= 0:
                self.deactivate_triple_shot()

    def rotate(self, delta_angle):
        # Add to angular velocity instead of directly to angle
        self.angular_velocity += delta_angle * self.angular_acceleration

        # Apply max angular velocity limit
        if self.angular_velocity > self.max_angular_velocity:
            self.angular_velocity = self.max_angular_velocity
        elif self.angular_velocity < -self.max_angular_velocity:
            self.angular_velocity = -self.max_angular_velocity

    def accelerate(self, speed):
        # Accelerate in the direction the triangle is facing
        rad = math.radians(self.angle)
        self.vel += pygame.Vector2(math.cos(rad), math.sin(rad)) * speed

        # Apply max speed limit
        if self.vel.length() > self.max_speed:
            self.vel = self.vel.normalize() * self.max_speed

    def draw(self, surface, camera_offset):
        # Calculate screen position (player should appear at center)
        screen_pos = pygame.Vector2(surface.get_width() // 2, surface.get_height() // 2)

        if hasattr(self, 'scaled_image') and self.scaled_image is not None:
            # Rotate the scaled sprite image based on the player's angle
            rotated_image = pygame.transform.rotate(self.scaled_image, -self.angle)

            # Get the rect and center it on the player position
            image_rect = rotated_image.get_rect()
            image_rect.center = (int(screen_pos.x), int(screen_pos.y))

            # Draw the rotated sprite
            surface.blit(rotated_image, image_rect)
        else:
            # Fallback to triangle if image loading failed
            points = [
                pygame.Vector2(self.original_size.x, 0),  # tip
                pygame.Vector2(-self.original_size.x / 2, -self.original_size.y / 2),  # left
                pygame.Vector2(-self.original_size.x / 2, self.original_size.y / 2),   # right
            ]

            # Rotate and translate points
            rotated = []
            for p in points:
                rotated.append(screen_pos + p.rotate(self.angle))
            pygame.draw.polygon(surface, self.color, rotated)  # Filled triangle

    def take_damage(self, amount):
        self.health -= amount
        if self.health < 0:
            self.health = 0

    def activate_triple_shot(self):
        self.triple_shot_active = True
        self.triple_shot_timer = TRIPLE_SHOT_DURATION

    def deactivate_triple_shot(self):
        self.triple_shot_active = False


class Enemy:
    """Enemy character with AI movement and combat capabilities."""

    # Class variable to store the loaded image (shared by all enemies)
    bat_image = None

    def __init__(self, color, size, pos, vel, angle=0, health=30):
        self.color = color
        self.size = pygame.Vector2(size)
        self.pos = pygame.Vector2(pos)
        self.vel = pygame.Vector2(vel)
        self.angle = angle
        self.max_speed = ENEMY_MAX_SPEED
        self.deceleration = ENEMY_DECELERATION
        self.health = health
        self.max_health = health

        # Size-based stats
        size_factor = (size[0] + size[1]) / 32  # Base size is around 32
        self.damage = int(8 * size_factor)  # Larger enemies do more damage
        self.projectile_speed = 8  # Slower than player projectiles
        self.vision_range = ENEMY_VISION_RANGE

        # Load the bat image if not already loaded
        if Enemy.bat_image is None:
            try:
                Enemy.bat_image = pygame.image.load("enemy_bat.png").convert_alpha()
            except pygame.error as e:
                print(f"Could not load enemy_bat.png: {e}")
                Enemy.bat_image = None

        # Scale the image to match the enemy size
        if Enemy.bat_image is not None:
            self.scaled_image = pygame.transform.scale(Enemy.bat_image, (int(self.size.x * 2), int(self.size.y * 2)))

    def update(self, player_pos):
        # Basic AI to slowly move toward the player
        direction = player_pos - self.pos
        if direction.length() > 0:
            direction = direction.normalize()
            self.vel += direction * 0.03  # Slower acceleration than player

        # Apply deceleration (friction) to gradually slow down
        self.vel *= self.deceleration

        # Stop very small velocities to prevent infinite drift
        if self.vel.length() < 0.01:
            self.vel = pygame.Vector2(0, 0)

        # Apply max speed limit
        if self.vel.length() > self.max_speed:
            self.vel = self.vel.normalize() * self.max_speed

        # Move in the current velocity direction
        self.pos += self.vel

    def draw(self, surface, camera_offset):
        # Calculate screen position
        screen_pos = self.pos - camera_offset

        # Only draw if on screen
        if -100 < screen_pos.x < WIDTH + 100 and -100 < screen_pos.y < HEIGHT + 100:
            if hasattr(self, 'scaled_image') and self.scaled_image is not None:
                # Rotate the image based on the enemy's angle
                rotated_image = pygame.transform.rotate(self.scaled_image, -self.angle)

                # Get the rect and center it on the enemy position
                image_rect = rotated_image.get_rect()
                image_rect.center = (int(screen_pos.x), int(screen_pos.y))

                # Draw the rotated image
                surface.blit(rotated_image, image_rect)
            else:
                # Fallback to triangle if image loading failed
                points = [
                    pygame.Vector2(self.size.x, 0),  # tip
                    pygame.Vector2(-self.size.x / 2, -self.size.y / 2),  # left
                    pygame.Vector2(-self.size.x / 2, self.size.y / 2),   # right
                ]

                # Rotate and translate points
                rotated = []
                for p in points:
                    rotated.append(screen_pos + p.rotate(self.angle))
                pygame.draw.polygon(surface, self.color, rotated)

    def can_see_player(self, player_pos):
        distance = (player_pos - self.pos).length()
        return distance <= self.vision_range

    def shoot(self, target_pos, projectile_list):
        # Only shoot if player is within vision range
        if not self.can_see_player(target_pos):
            return

        # Calculate the direction to the target with randomized spread
        direction = target_pos - self.pos
        if direction.length() > 0:
            direction = direction.normalize()

            # Add large randomized spread to make shots inaccurate
            spread_angle = random.uniform(-0.5, 0.5)  # ±0.5 radians = ±28.6 degrees spread
            cos_spread = math.cos(spread_angle)
            sin_spread = math.sin(spread_angle)

            # Rotate the direction vector by the spread angle
            spread_direction = pygame.Vector2(
                direction.x * cos_spread - direction.y * sin_spread,
                direction.x * sin_spread + direction.y * cos_spread
            )

            # Create projectile with spread and slower speed
            projectile_vel = spread_direction * self.projectile_speed
            projectile = Projectile(RED, self.pos.copy(), projectile_vel)  # Red enemy projectiles
            projectile.damage = self.damage
            projectile_list.append(projectile)

    def take_damage(self, amount):
        self.health -= amount
        if self.health < 0:
            self.health = 0


class Projectile:
    """Projectile fired by players and enemies."""

    def __init__(self, color, pos, vel, length=10):
        self.color = color
        self.pos = pygame.Vector2(pos)
        self.vel = pygame.Vector2(vel)
        self.length = length
        self.lifetime = 300  # Projectile disappears after 5 seconds at 60 FPS
        self.damage = 10  # Default damage

    def update(self):
        self.pos += self.vel
        self.lifetime -= 1
        return self.lifetime > 0  # Return False when projectile should be removed

    def draw(self, surface, camera_offset):
        # Convert world position to screen position using camera offset
        screen_pos = self.pos - camera_offset
        # Only draw if on screen
        if -20 < screen_pos.x < WIDTH + 20 and -20 < screen_pos.y < HEIGHT + 20:
            # Calculate the direction of movement to draw the line along velocity
            if self.vel.length() > 0:
                direction = self.vel.normalize()
                # Calculate start and end points for the line
                half_length = self.length / 2
                start_pos = screen_pos - direction * half_length
                end_pos = screen_pos + direction * half_length
                pygame.draw.line(surface, self.color, start_pos, end_pos, 3)  # Increased thickness to 3


class Powerup:
    """Powerup items that enhance player abilities."""

    def __init__(self, powerup_type, pos):
        self.type = powerup_type  # "triple_shot", etc.
        self.pos = pygame.Vector2(pos)
        self.size = 12  # Powerup size
        self.collected = False

    def draw(self, surface, camera_offset):
        # Convert world position to screen position using camera offset
        screen_pos = self.pos - camera_offset
        # Only draw if on screen
        if -50 < screen_pos.x < WIDTH + 50 and -50 < screen_pos.y < HEIGHT + 50:
            if self.type == "triple_shot":
                # Draw cyan plus symbol
                # Horizontal line
                pygame.draw.line(surface, CYAN,
                               (screen_pos.x - self.size//2, screen_pos.y),
                               (screen_pos.x + self.size//2, screen_pos.y), 3)
                # Vertical line
                pygame.draw.line(surface, CYAN,
                               (screen_pos.x, screen_pos.y - self.size//2),
                               (screen_pos.x, screen_pos.y + self.size//2), 3)

    def check_collision(self, player_pos, player_size):
        # Check if player is close enough to collect powerup
        distance = (self.pos - player_pos).length()
        return distance < (self.size + player_size.x / 2)
