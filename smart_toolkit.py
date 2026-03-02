"""
Smart Toolkit – Intrusive Thought Dismisser for Competitive Gamers
==================================================================

A Pygame-based mental health micro-intervention prototype that lets users
"swipe away" intrusive thoughts. Designed as a pre-game anxiety reducer
for competitive gamers and esports players.

Wildcard 2 (Alternative UI): ALL interaction is gesture-based (mouse drag).
No text entry, no multiple-choice surveys. Swipe mechanics only.

Wildcard 3 (Hyper-Niche): Targets competitive gamers dealing with tilt,
ranked anxiety, and performance pressure.

Functional Loop:
  1. CAPTURE  – User clicks and drags thought bubbles (simulated swipe)
  2. PROCESS  – StressAnalyzer ingests swipe speed/frequency → anxiety score
  3. DELIVER  – CalmingEngine renders particles, affirmations, or breathing guide

Controls:
  - Click + drag a thought bubble to swipe it away
  - No keyboard input needed (ESC to quit)
"""

import pygame
import sys
import math
import random
import time
from collections import deque

# ──────────────────────────────────────────────────────────────────────
# CONSTANTS
# ──────────────────────────────────────────────────────────────────────
SCREEN_W, SCREEN_H = 480, 800  # Portrait mobile-like aspect ratio
FPS = 60
SWIPE_DISMISS_DIST = 100  # Minimum drag distance to dismiss a thought

# Color palette – dark gaming aesthetic
BG_TOP = (15, 10, 30)
BG_BOTTOM = (30, 20, 60)
ACCENT_PURPLE = (140, 80, 255)
ACCENT_CYAN = (0, 220, 255)
ACCENT_PINK = (255, 80, 180)
ACCENT_GREEN = (0, 255, 160)
WHITE = (255, 255, 255)
DIM_WHITE = (180, 180, 200)
DARK_PANEL = (20, 15, 40, 200)
STRESS_LOW = (0, 255, 160)
STRESS_MED = (255, 200, 0)
STRESS_HIGH = (255, 60, 80)
BUBBLE_COLORS = [
    (80, 50, 160),
    (60, 40, 120),
    (100, 60, 180),
    (70, 45, 140),
    (90, 55, 170),
]

# Gamer-themed intrusive thoughts
INTRUSIVE_THOUGHTS = [
    "I'm going to lose this match...",
    "My teammates will flame me",
    "I always choke under pressure",
    "I'm not good enough for this rank",
    "Everyone is watching me fail",
    "I'll never hit my peak rank",
    "What if I tilt again?",
    "My aim is so inconsistent",
    "I should just quit competitive",
    "They'll judge my performance",
    "I'm dragging the team down",
    "This is going to be a losing streak",
    "My reaction time is too slow",
    "I can't focus right now",
    "What if I make a critical mistake?",
    "I don't deserve this rank",
]

# Gamer-themed affirmations
AFFIRMATIONS = [
    "You've clutched harder rounds than this.",
    "One game at a time. You've got this!",
    "Your skill is real. Trust the grind.",
    "Breathe. Reset. Dominate.",
    "Tilt is temporary. Your talent is permanent.",
    "Every pro has bad games. Keep going!",
    "You're stronger than one bad play.",
    "Focus on YOUR game, not theirs.",
    "Confidence is a skill. Practice it now.",
    "You belong at this level.",
    "Let go. Next round is a clean slate.",
    "Calm mind = faster reflexes.",
]

# Breathing guide timing (seconds)
INHALE_TIME = 4.0
HOLD_TIME = 4.0
EXHALE_TIME = 6.0
BREATH_CYCLE = INHALE_TIME + HOLD_TIME + EXHALE_TIME

# Combo system
COMBO_TIMEOUT = 4.0  # Seconds before combo resets
COMBO_COLORS = [(0, 255, 160), (255, 200, 0), (255, 120, 0), (255, 60, 80), (200, 60, 255)]

# Rhythm tap grounding
TAP_CIRCLE_RADIUS = 30
TAP_BPM = 72  # Beats per minute for grounding rhythm
TAP_INTERVAL = 60.0 / TAP_BPM
TAP_TARGETS_COUNT = 8  # Total taps in one grounding session
TAP_HIT_WINDOW = 0.35  # Seconds tolerance for "on beat"

# App states
STATE_MOOD_CHECKIN = "mood_checkin"
STATE_MAIN = "main"
STATE_SUMMARY = "summary"

import numpy as np


# ──────────────────────────────────────────────────────────────────────
# SOUND MANAGER (Programmatic — no external files)
# ──────────────────────────────────────────────────────────────────────
class SoundManager:
    """Generates and plays tones using pygame.sndarray + numpy."""
    def __init__(self):
        self.enabled = False
        self.dismiss_snd = None
        self.combo_snd = None
        self.warning_snd = None
        self.tap_hit_snd = None
        self.tap_miss_snd = None

    def init_after_pygame(self):
        """Call this AFTER pygame.init() to generate sounds."""
        try:
            freq, size, channels = pygame.mixer.get_init()
            self.sample_rate = freq
            self.channels = channels
            self.enabled = True
        except Exception:
            self.enabled = False
            return
        self.dismiss_snd = self._make_chime([523, 659, 784], 0.15)
        self.combo_snd = self._make_chime([523, 659, 784, 1047], 0.12)
        self.warning_snd = self._make_tone(110, 0.4, volume=0.15)
        self.tap_hit_snd = self._make_tone(880, 0.08, volume=0.3)
        self.tap_miss_snd = self._make_tone(220, 0.15, volume=0.2)

    def _to_stereo(self, mono_array):
        if self.channels == 2:
            return np.column_stack((mono_array, mono_array))
        return mono_array

    def _make_tone(self, freq, duration, volume=0.3):
        if not self.enabled:
            return None
        n = int(self.sample_rate * duration)
        t = np.linspace(0, duration, n, dtype=np.float64)
        wave = np.sin(2 * np.pi * freq * t) * volume
        fade = np.minimum(t / 0.01, 1.0) * np.minimum((duration - t) / 0.05, 1.0)
        samples = (wave * fade * 32767).astype(np.int16)
        return pygame.sndarray.make_sound(self._to_stereo(samples))

    def _make_chime(self, freqs, note_dur, volume=0.25):
        if not self.enabled:
            return None
        parts = []
        for f in freqs:
            n = int(self.sample_rate * note_dur)
            t = np.linspace(0, note_dur, n, dtype=np.float64)
            wave = np.sin(2 * np.pi * f * t) * volume
            fade = np.minimum(t / 0.005, 1.0) * np.minimum((note_dur - t) / 0.03, 1.0)
            parts.append((wave * fade * 32767).astype(np.int16))
        combined = np.concatenate(parts)
        return pygame.sndarray.make_sound(self._to_stereo(combined))

    def play_dismiss(self):
        if self.enabled and self.dismiss_snd:
            self.dismiss_snd.play()

    def play_combo(self):
        if self.enabled and self.combo_snd:
            self.combo_snd.play()

    def play_warning(self):
        if self.enabled and self.warning_snd:
            self.warning_snd.play()

    def play_tap_hit(self):
        if self.enabled and self.tap_hit_snd:
            self.tap_hit_snd.play()

    def play_tap_miss(self):
        if self.enabled and self.tap_miss_snd:
            self.tap_miss_snd.play()


# ──────────────────────────────────────────────────────────────────────
# UTILITY FUNCTIONS
# ──────────────────────────────────────────────────────────────────────
def lerp(a, b, t):
    """Linear interpolation."""
    return a + (b - a) * max(0, min(1, t))


def lerp_color(c1, c2, t):
    """Interpolate between two RGB colors."""
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


def draw_gradient_bg(surface):
    """Draw a vertical gradient background."""
    for y in range(SCREEN_H):
        t = y / SCREEN_H
        color = lerp_color(BG_TOP, BG_BOTTOM, t)
        pygame.draw.line(surface, color, (0, y), (SCREEN_W, y))


def draw_rounded_rect(surface, color, rect, radius, alpha=255):
    """Draw a rounded rectangle with optional alpha."""
    if alpha < 255:
        s = pygame.Surface((rect[2], rect[3]), pygame.SRCALPHA)
        pygame.draw.rect(s, (*color[:3], alpha), (0, 0, rect[2], rect[3]),
                         border_radius=radius)
        surface.blit(s, (rect[0], rect[1]))
    else:
        pygame.draw.rect(surface, color, rect, border_radius=radius)


def draw_text_centered(surface, text, font, color, center_pos):
    """Render text centered at a position."""
    rendered = font.render(text, True, color)
    rect = rendered.get_rect(center=center_pos)
    surface.blit(rendered, rect)


def draw_text_wrapped(surface, text, font, color, rect_area, line_spacing=4):
    """Render word-wrapped text inside a rect area. Returns total height used."""
    words = text.split(' ')
    lines = []
    current_line = ""
    for word in words:
        test = current_line + word + " "
        if font.size(test)[0] <= rect_area[2]:
            current_line = test
        else:
            if current_line:
                lines.append(current_line.strip())
            current_line = word + " "
    if current_line:
        lines.append(current_line.strip())

    y = rect_area[1]
    for line in lines:
        rendered = font.render(line, True, color)
        surface.blit(rendered, (rect_area[0], y))
        y += font.get_height() + line_spacing
    return y - rect_area[1]


# ──────────────────────────────────────────────────────────────────────
# PARTICLE SYSTEM
# ──────────────────────────────────────────────────────────────────────
class Particle:
    """A single particle for burst effects."""
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        angle = random.uniform(0, math.pi * 2)
        speed = random.uniform(80, 250)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.life = 1.0
        self.decay = random.uniform(0.8, 1.8)
        self.radius = random.uniform(2, 6)
        self.color = color

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.vx *= 0.97
        self.vy *= 0.97
        self.life -= self.decay * dt
        return self.life > 0

    def draw(self, surface):
        alpha = max(0, min(255, int(self.life * 255)))
        r = max(1, int(self.radius * self.life))
        s = pygame.Surface((r * 2, r * 2), pygame.SRCALPHA)
        pygame.draw.circle(s, (*self.color, alpha), (r, r), r)
        surface.blit(s, (int(self.x) - r, int(self.y) - r))


class ParticleSystem:
    """Manages all active particles."""
    def __init__(self):
        self.particles = []

    def burst(self, x, y, color, count=25):
        for _ in range(count):
            self.particles.append(Particle(x, y, color))

    def update(self, dt):
        self.particles = [p for p in self.particles if p.update(dt)]

    def draw(self, surface):
        for p in self.particles:
            p.draw(surface)


# ──────────────────────────────────────────────────────────────────────
# THOUGHT BUBBLE
# ──────────────────────────────────────────────────────────────────────
class ThoughtBubble:
    """
    A floating thought bubble the user can swipe away.
    Drifts gently and has a pulsing glow effect.
    """
    def __init__(self, text, font, x=None, y=None):
        self.text = text
        self.font = font
        self.width = 200
        self.height = 90
        self.x = x if x is not None else random.randint(30, SCREEN_W - self.width - 30)
        self.y = y if y is not None else random.randint(120, SCREEN_H - 250)
        self.base_y = self.y
        self.color = random.choice(BUBBLE_COLORS)
        self.glow_phase = random.uniform(0, math.pi * 2)
        self.drift_phase = random.uniform(0, math.pi * 2)
        self.drift_speed = random.uniform(0.3, 0.8)
        self.alive = True
        self.grabbed = False
        self.grab_offset = (0, 0)
        self.alpha = 0  # Fade in
        self.target_alpha = 255
        self.shake = 0  # Shake intensity when grabbed
        self.spawn_time = time.time()

    def contains(self, mx, my):
        return (self.x <= mx <= self.x + self.width and
                self.y <= my <= self.y + self.height)

    def update(self, dt):
        # Fade in
        self.alpha = lerp(self.alpha, self.target_alpha, dt * 4)

        # Gentle floating drift
        if not self.grabbed:
            self.drift_phase += self.drift_speed * dt
            self.y = self.base_y + math.sin(self.drift_phase) * 8
        else:
            self.shake = lerp(self.shake, 2, dt * 5)

        self.glow_phase += dt * 2.5

    def draw(self, surface):
        alpha = max(0, min(255, int(self.alpha)))
        if alpha <= 0:
            return

        # Glow effect
        glow_intensity = (math.sin(self.glow_phase) * 0.3 + 0.7)
        glow_color = lerp_color(self.color, ACCENT_PURPLE, 0.3)

        # Shake offset when grabbed
        sx = random.uniform(-self.shake, self.shake) if self.grabbed else 0
        sy = random.uniform(-self.shake, self.shake) if self.grabbed else 0

        draw_x = int(self.x + sx)
        draw_y = int(self.y + sy)

        # Outer glow
        glow_r = 12
        glow_surface = pygame.Surface(
            (self.width + glow_r * 2, self.height + glow_r * 2), pygame.SRCALPHA
        )
        glow_alpha = int(40 * glow_intensity)
        pygame.draw.rect(
            glow_surface,
            (*glow_color, glow_alpha),
            (0, 0, self.width + glow_r * 2, self.height + glow_r * 2),
            border_radius=20,
        )
        surface.blit(glow_surface, (draw_x - glow_r, draw_y - glow_r))

        # Main bubble
        bubble_surface = pygame.Surface(
            (self.width, self.height), pygame.SRCALPHA
        )
        pygame.draw.rect(
            bubble_surface,
            (*self.color, alpha),
            (0, 0, self.width, self.height),
            border_radius=16,
        )
        # Border
        border_alpha = int(alpha * 0.6)
        pygame.draw.rect(
            bubble_surface,
            (*ACCENT_PURPLE, border_alpha),
            (0, 0, self.width, self.height),
            width=2,
            border_radius=16,
        )
        surface.blit(bubble_surface, (draw_x, draw_y))

        # Text
        draw_text_wrapped(
            surface, self.text, self.font, (*DIM_WHITE[:3],),
            (draw_x + 14, draw_y + 14, self.width - 28, self.height - 28),
        )


# ──────────────────────────────────────────────────────────────────────
# STRESS ANALYZER
# ──────────────────────────────────────────────────────────────────────
class StressAnalyzer:
    """
    Processes swipe gesture metrics to derive a real-time anxiety score.

    Inputs per swipe:
      - speed (px/s): faster swipes → more agitation
      - duration (s): very quick, jerky swipes → more agitation
      - direction changes: erratic motion during drag → more agitation

    The score is a weighted rolling average, decaying over time when
    the user is idle (simulating calming down).
    """
    def __init__(self):
        self.swipe_log = deque(maxlen=15)  # Recent swipes
        self.anxiety_score = 0.0  # 0–100
        self.last_swipe_time = time.time()

    def record_swipe(self, speed, duration, direction_changes):
        """Record a completed swipe and update anxiety."""
        # Normalize metrics
        speed_score = min(speed / 600, 1.0)  # 600 px/s = max agitation
        quick_score = max(0, 1.0 - duration / 1.5)  # < 0.3s = very jerky
        erratic_score = min(direction_changes / 8, 1.0)

        # Weighted composite
        swipe_stress = (speed_score * 0.5 +
                        quick_score * 0.25 +
                        erratic_score * 0.25) * 100

        self.swipe_log.append(swipe_stress)
        self.last_swipe_time = time.time()

        # Rolling average
        if self.swipe_log:
            target = sum(self.swipe_log) / len(self.swipe_log)
            self.anxiety_score = lerp(self.anxiety_score, target, 0.4)

    def update(self, dt):
        """Decay anxiety when idle (user is calming down)."""
        idle = time.time() - self.last_swipe_time
        if idle > 2.0:
            decay_rate = 5.0 * dt  # Lose ~5 points/sec after 2s idle
            self.anxiety_score = max(0, self.anxiety_score - decay_rate)

    def get_level(self):
        """Return anxiety level as a string."""
        if self.anxiety_score < 30:
            return "calm"
        elif self.anxiety_score < 65:
            return "moderate"
        else:
            return "high"


# ──────────────────────────────────────────────────────────────────────
# SWIPE DETECTOR
# ──────────────────────────────────────────────────────────────────────
class SwipeDetector:
    """
    Tracks mouse drag gestures and computes:
      - total distance
      - average speed
      - duration
      - number of direction changes (erratic motion)
    """
    def __init__(self):
        self.dragging = False
        self.start_pos = None
        self.start_time = None
        self.positions = []
        self.last_dir = None
        self.direction_changes = 0

    def start(self, pos):
        self.dragging = True
        self.start_pos = pos
        self.start_time = time.time()
        self.positions = [pos]
        self.last_dir = None
        self.direction_changes = 0

    def update_drag(self, pos):
        if not self.dragging:
            return
        self.positions.append(pos)

        # Track direction changes
        if len(self.positions) >= 3:
            p1 = self.positions[-3]
            p2 = self.positions[-2]
            p3 = self.positions[-1]
            d1 = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
            d2 = math.atan2(p3[1] - p2[1], p3[0] - p2[0])
            angle_diff = abs(d2 - d1)
            if angle_diff > math.pi:
                angle_diff = 2 * math.pi - angle_diff
            if angle_diff > 0.8:  # ~45 degrees
                self.direction_changes += 1

    def end(self):
        if not self.dragging:
            return None
        self.dragging = False
        end_pos = self.positions[-1] if self.positions else self.start_pos
        duration = max(0.01, time.time() - self.start_time)

        # Total distance
        total_dist = 0
        for i in range(1, len(self.positions)):
            dx = self.positions[i][0] - self.positions[i - 1][0]
            dy = self.positions[i][1] - self.positions[i - 1][1]
            total_dist += math.sqrt(dx * dx + dy * dy)

        # Displacement
        dx = end_pos[0] - self.start_pos[0]
        dy = end_pos[1] - self.start_pos[1]
        displacement = math.sqrt(dx * dx + dy * dy)

        speed = total_dist / duration

        return {
            "displacement": displacement,
            "total_dist": total_dist,
            "speed": speed,
            "duration": duration,
            "direction_changes": self.direction_changes,
            "start": self.start_pos,
            "end": end_pos,
        }


# ──────────────────────────────────────────────────────────────────────
# BREATHING GUIDE
# ──────────────────────────────────────────────────────────────────────
class BreathingGuide:
    """
    Animated expanding/contracting circle breathing visualizer.
    Activates when anxiety is high.
    """
    def __init__(self):
        self.active = False
        self.phase_time = 0
        self.opacity = 0
        self.target_opacity = 0

    def activate(self):
        if not self.active:
            self.active = True
            self.phase_time = 0
            self.target_opacity = 255

    def deactivate(self):
        self.target_opacity = 0

    def update(self, dt):
        self.opacity = lerp(self.opacity, self.target_opacity, dt * 3)
        if self.opacity < 1 and self.target_opacity == 0:
            self.active = False
            self.opacity = 0
            return

        if self.active:
            self.phase_time = (self.phase_time + dt) % BREATH_CYCLE

    def _get_phase(self):
        """Return (phase_name, progress_0_to_1)."""
        if self.phase_time < INHALE_TIME:
            return "INHALE", self.phase_time / INHALE_TIME
        elif self.phase_time < INHALE_TIME + HOLD_TIME:
            return "HOLD", (self.phase_time - INHALE_TIME) / HOLD_TIME
        else:
            return "EXHALE", (self.phase_time - INHALE_TIME - HOLD_TIME) / EXHALE_TIME

    def draw(self, surface, font_large, font_small):
        if not self.active or self.opacity < 1:
            return

        alpha = int(self.opacity)
        phase, progress = self._get_phase()

        # Circle size
        min_r, max_r = 40, 110
        if phase == "INHALE":
            # Ease-in-out expansion
            t = 0.5 - 0.5 * math.cos(progress * math.pi)
            radius = lerp(min_r, max_r, t)
        elif phase == "HOLD":
            radius = max_r
        else:
            t = 0.5 - 0.5 * math.cos(progress * math.pi)
            radius = lerp(max_r, min_r, t)

        cx, cy = SCREEN_W // 2, SCREEN_H // 2 + 40

        # Overlay dimmer
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        overlay.fill((10, 5, 25, int(alpha * 0.75)))
        surface.blit(overlay, (0, 0))

        # Outer glow rings
        for i in range(3):
            ring_r = int(radius + 15 + i * 12)
            ring_alpha = int(alpha * 0.15 * (1 - i / 3))
            ring_surface = pygame.Surface((ring_r * 2 + 4, ring_r * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(ring_surface, (*ACCENT_CYAN, ring_alpha),
                               (ring_r + 2, ring_r + 2), ring_r, width=2)
            surface.blit(ring_surface, (cx - ring_r - 2, cy - ring_r - 2))

        # Main circle
        r = int(radius)
        circle_surface = pygame.Surface((r * 2 + 4, r * 2 + 4), pygame.SRCALPHA)
        # Gradient fill – inner lighter
        for gr in range(r, 0, -2):
            t = gr / r
            c = lerp_color(ACCENT_CYAN, ACCENT_PURPLE, t)
            ga = int(alpha * (0.3 + 0.4 * (1 - t)))
            pygame.draw.circle(circle_surface, (*c, ga), (r + 2, r + 2), gr)
        surface.blit(circle_surface, (cx - r - 2, cy - r - 2))

        # Phase text
        phase_text = phase
        timer_text = ""
        if phase == "INHALE":
            remaining = INHALE_TIME - self.phase_time
            timer_text = f"{remaining:.0f}s"
        elif phase == "HOLD":
            remaining = HOLD_TIME - (self.phase_time - INHALE_TIME)
            timer_text = f"{remaining:.0f}s"
        else:
            remaining = EXHALE_TIME - (self.phase_time - INHALE_TIME - HOLD_TIME)
            timer_text = f"{remaining:.0f}s"

        draw_text_centered(surface, phase_text, font_large, (*ACCENT_CYAN,), (cx, cy - 10))
        draw_text_centered(surface, timer_text, font_small, (*WHITE,), (cx, cy + 25))

        # Instruction
        draw_text_centered(surface, "Follow the circle rhythm",
                           font_small, (*DIM_WHITE,), (cx, cy + r + 40))
        draw_text_centered(surface, "Swipe thoughts to continue dismissing",
                           font_small, (*DIM_WHITE,), (cx, cy + r + 65))


# ──────────────────────────────────────────────────────────────────────
# AFFIRMATION DISPLAY
# ──────────────────────────────────────────────────────────────────────
class AffirmationDisplay:
    """Floating affirmation text that fades in and out."""
    def __init__(self):
        self.text = ""
        self.opacity = 0
        self.y_offset = 0
        self.timer = 0

    def show(self, text):
        self.text = text
        self.opacity = 255
        self.y_offset = 0
        self.timer = 3.0  # Display for 3 seconds

    def update(self, dt):
        if self.timer > 0:
            self.timer -= dt
            self.y_offset -= 15 * dt  # Drift upward
            if self.timer < 1.0:
                self.opacity = lerp(self.opacity, 0, dt * 4)
        else:
            self.opacity = 0

    def draw(self, surface, font):
        if self.opacity < 5:
            return
        alpha = int(max(0, min(255, self.opacity)))
        text_surface = font.render(self.text, True, ACCENT_GREEN)
        text_surface.set_alpha(alpha)
        rect = text_surface.get_rect(
            center=(SCREEN_W // 2, SCREEN_H - 180 + int(self.y_offset))
        )
        surface.blit(text_surface, rect)


# ──────────────────────────────────────────────────────────────────────
# MOOD CHECK-IN (Gesture slider — no text input)
# ──────────────────────────────────────────────────────────────────────
class MoodCheckIn:
    """Drag-to-set mood slider at session start. Pure gesture input."""
    def __init__(self):
        self.bar_x = 60
        self.bar_y = SCREEN_H // 2
        self.bar_w = SCREEN_W - 120
        self.bar_h = 16
        self.handle_x = self.bar_x + self.bar_w // 2  # Start at center
        self.dragging = False
        self.done = False
        self.fade_out = 0
        self.mood_value = 0.5  # 0=calm, 1=stressed

    def handle_event(self, event):
        if self.done:
            return
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            mx, my = event.pos
            if abs(my - self.bar_y) < 40 and self.bar_x - 20 <= mx <= self.bar_x + self.bar_w + 20:
                self.dragging = True
        elif event.type == pygame.MOUSEMOTION and self.dragging:
            self.handle_x = max(self.bar_x, min(self.bar_x + self.bar_w, event.pos[0]))
            self.mood_value = (self.handle_x - self.bar_x) / self.bar_w
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            if self.dragging:
                self.dragging = False
                self.done = True

    def get_initial_anxiety(self):
        return self.mood_value * 60  # Seed 0–60

    def update(self, dt):
        if self.done:
            self.fade_out = min(1, self.fade_out + dt * 3)

    def draw(self, surface, font_large, font_medium, font_small):
        if self.fade_out >= 1:
            return
        alpha = int(255 * (1 - self.fade_out))
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        overlay.fill((*BG_TOP, alpha))
        surface.blit(overlay, (0, 0))

        draw_text_centered(surface, "MINDSHIELD", font_large, ACCENT_CYAN,
                           (SCREEN_W // 2, 160))
        draw_text_centered(surface, "How are you feeling right now?", font_medium,
                           DIM_WHITE, (SCREEN_W // 2, 220))
        draw_text_centered(surface, "Drag the handle to set your mood", font_small,
                           (*ACCENT_PURPLE,), (SCREEN_W // 2, 250))

        # Bar bg
        pygame.draw.rect(surface, (40, 30, 70),
                         (self.bar_x, self.bar_y - self.bar_h // 2, self.bar_w, self.bar_h),
                         border_radius=8)
        # Gradient fill
        for x in range(self.bar_w):
            t = x / self.bar_w
            c = lerp_color(STRESS_LOW, STRESS_HIGH, t)
            pygame.draw.line(surface, c,
                             (self.bar_x + x, self.bar_y - self.bar_h // 2 + 2),
                             (self.bar_x + x, self.bar_y + self.bar_h // 2 - 2))

        # Handle
        hx = int(self.handle_x)
        pygame.draw.circle(surface, WHITE, (hx, self.bar_y), 18)
        hc = lerp_color(STRESS_LOW, STRESS_HIGH, self.mood_value)
        pygame.draw.circle(surface, hc, (hx, self.bar_y), 14)

        # Labels
        draw_text_centered(surface, "Calm", font_small, STRESS_LOW,
                           (self.bar_x, self.bar_y + 35))
        draw_text_centered(surface, "Stressed", font_small, STRESS_HIGH,
                           (self.bar_x + self.bar_w, self.bar_y + 35))

        if not self.done:
            draw_text_centered(surface, "Release to continue", font_small,
                               DIM_WHITE, (SCREEN_W // 2, SCREEN_H - 100))


# ──────────────────────────────────────────────────────────────────────
# COMBO SYSTEM
# ──────────────────────────────────────────────────────────────────────
class ComboSystem:
    """Tracks consecutive dismiss streaks for gamification."""
    def __init__(self):
        self.count = 0
        self.best = 0
        self.last_dismiss_time = 0
        self.display_timer = 0
        self.scale = 1.0

    def record_dismiss(self):
        now = time.time()
        if now - self.last_dismiss_time < COMBO_TIMEOUT:
            self.count += 1
        else:
            self.count = 1
        self.last_dismiss_time = now
        self.display_timer = 2.0
        self.scale = 1.5
        self.best = max(self.best, self.count)
        return self.count

    def update(self, dt):
        if time.time() - self.last_dismiss_time > COMBO_TIMEOUT and self.count > 0:
            self.count = 0
        if self.display_timer > 0:
            self.display_timer -= dt
        self.scale = lerp(self.scale, 1.0, dt * 5)

    def draw(self, surface, font):
        if self.count < 2 or self.display_timer <= 0:
            return
        color = COMBO_COLORS[min(self.count - 1, len(COMBO_COLORS) - 1)]
        text = f"x{self.count} COMBO!"
        s = int(28 * self.scale)
        combo_font = pygame.font.SysFont("Segoe UI", s, bold=True)
        alpha = int(min(255, self.display_timer * 255))
        txt = combo_font.render(text, True, color)
        txt.set_alpha(alpha)
        rect = txt.get_rect(center=(SCREEN_W // 2, 155))
        surface.blit(txt, rect)


# ──────────────────────────────────────────────────────────────────────
# RHYTHM TAP GROUNDING EXERCISE
# ──────────────────────────────────────────────────────────────────────
class RhythmTapExercise:
    """Click targets in rhythm for grounding. Activates at moderate stress."""
    def __init__(self):
        self.active = False
        self.targets = []
        self.current_idx = 0
        self.beat_timer = 0
        self.hits = 0
        self.misses = 0
        self.opacity = 0
        self.total_taps = TAP_TARGETS_COUNT
        self.ring_phase = 0
        self.result_timer = 0
        self.result_text = ""

    def activate(self):
        if self.active:
            return
        self.active = True
        self.current_idx = 0
        self.beat_timer = TAP_INTERVAL
        self.hits = 0
        self.misses = 0
        self.opacity = 0
        self.result_timer = 0
        self._gen_targets()

    def _gen_targets(self):
        self.targets = []
        for _ in range(self.total_taps):
            x = random.randint(80, SCREEN_W - 80)
            y = random.randint(200, SCREEN_H - 200)
            self.targets.append((x, y))

    def deactivate(self):
        self.active = False
        self.opacity = 0

    def handle_click(self, mx, my):
        if not self.active or self.current_idx >= len(self.targets):
            return False
        tx, ty = self.targets[self.current_idx]
        dist = math.sqrt((mx - tx) ** 2 + (my - ty) ** 2)
        if dist < TAP_CIRCLE_RADIUS + 15:
            if self.beat_timer < TAP_HIT_WINDOW or self.beat_timer > TAP_INTERVAL - TAP_HIT_WINDOW:
                self.hits += 1
            else:
                self.misses += 1
            self.current_idx += 1
            self.beat_timer = 0
            if self.current_idx >= len(self.targets):
                acc = self.hits / self.total_taps * 100
                self.result_text = f"Rhythm accuracy: {acc:.0f}%"
                self.result_timer = 3.0
            return True
        return False

    def update(self, dt):
        if not self.active:
            return
        self.opacity = min(255, self.opacity + dt * 400)
        self.beat_timer += dt
        self.ring_phase += dt * 4
        if self.beat_timer >= TAP_INTERVAL and self.current_idx < len(self.targets):
            self.misses += 1
            self.current_idx += 1
            self.beat_timer = 0
            if self.current_idx >= len(self.targets):
                acc = self.hits / self.total_taps * 100
                self.result_text = f"Rhythm accuracy: {acc:.0f}%"
                self.result_timer = 3.0
        if self.result_timer > 0:
            self.result_timer -= dt
            if self.result_timer <= 0:
                self.deactivate()

    def draw(self, surface, font_medium, font_small):
        if not self.active:
            return
        alpha = int(self.opacity)
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        overlay.fill((10, 5, 25, int(alpha * 0.6)))
        surface.blit(overlay, (0, 0))

        draw_text_centered(surface, "GROUNDING: Tap the circles in rhythm",
                           font_small, ACCENT_CYAN, (SCREEN_W // 2, 140))

        # Progress
        prog = f"{self.current_idx}/{self.total_taps}"
        draw_text_centered(surface, prog, font_small, DIM_WHITE, (SCREEN_W // 2, 165))

        # Current target
        if self.current_idx < len(self.targets):
            tx, ty = self.targets[self.current_idx]
            # Pulsing ring
            pulse = (math.sin(self.ring_phase) * 0.3 + 0.7)
            r = int(TAP_CIRCLE_RADIUS + 8 * pulse)
            ring_s = pygame.Surface((r * 2 + 4, r * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(ring_s, (*ACCENT_CYAN, int(alpha * 0.5)), (r + 2, r + 2), r, width=3)
            surface.blit(ring_s, (tx - r - 2, ty - r - 2))
            # Inner circle
            cs = pygame.Surface((TAP_CIRCLE_RADIUS * 2 + 4, TAP_CIRCLE_RADIUS * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(cs, (*ACCENT_PURPLE, alpha),
                               (TAP_CIRCLE_RADIUS + 2, TAP_CIRCLE_RADIUS + 2), TAP_CIRCLE_RADIUS)
            surface.blit(cs, (tx - TAP_CIRCLE_RADIUS - 2, ty - TAP_CIRCLE_RADIUS - 2))
            # Beat indicator bar
            bar_w = 100
            bar_h = 6
            bx = SCREEN_W // 2 - bar_w // 2
            by = SCREEN_H - 130
            pygame.draw.rect(surface, (40, 30, 70), (bx, by, bar_w, bar_h), border_radius=3)
            fill = int(bar_w * (self.beat_timer / TAP_INTERVAL))
            pygame.draw.rect(surface, ACCENT_GREEN, (bx, by, fill, bar_h), border_radius=3)
            draw_text_centered(surface, "Tap when bar fills", font_small,
                               DIM_WHITE, (SCREEN_W // 2, by + 20))

        # Result text
        if self.result_timer > 0:
            draw_text_centered(surface, self.result_text,
                               font_medium, ACCENT_GREEN, (SCREEN_W // 2, SCREEN_H // 2))


# ──────────────────────────────────────────────────────────────────────
# SESSION SUMMARY
# ──────────────────────────────────────────────────────────────────────
class SessionSummary:
    """End-of-session stats screen."""
    def __init__(self):
        self.active = False
        self.opacity = 0
        self.stats = {}

    def show(self, dismissed, session_secs, peak_anxiety, avg_anxiety, final_anxiety, best_combo):
        self.active = True
        self.opacity = 0
        mins = int(session_secs // 60)
        secs = int(session_secs % 60)
        self.stats = {
            "Thoughts Dismissed": str(dismissed),
            "Session Duration": f"{mins}:{secs:02d}",
            "Peak Anxiety": f"{peak_anxiety:.0f}/100",
            "Average Anxiety": f"{avg_anxiety:.0f}/100",
            "Final Anxiety": f"{final_anxiety:.0f}/100",
            "Best Combo": f"x{best_combo}" if best_combo > 1 else "---",
        }
        # Pick a final message
        if final_anxiety < 30:
            self.message = "You're in a great headspace. Go dominate!"
        elif final_anxiety < 60:
            self.message = "Solid session. You're ready to focus."
        else:
            self.message = "Take a few more breaths — you've got this."

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN or (
                event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE):
            return True  # Signal to quit
        return False

    def update(self, dt):
        self.opacity = min(255, self.opacity + dt * 300)

    def draw(self, surface, font_large, font_medium, font_small, bg_surface):
        surface.blit(bg_surface, (0, 0))
        alpha = int(self.opacity)
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        overlay.fill((10, 5, 25, int(alpha * 0.85)))
        surface.blit(overlay, (0, 0))

        draw_text_centered(surface, "SESSION COMPLETE", font_large,
                           ACCENT_CYAN, (SCREEN_W // 2, 80))

        y = 150
        for label, value in self.stats.items():
            draw_text_centered(surface, label, font_small, DIM_WHITE, (SCREEN_W // 2, y))
            draw_text_centered(surface, value, font_medium, WHITE, (SCREEN_W // 2, y + 22))
            y += 60

        draw_text_centered(surface, self.message, font_medium,
                           ACCENT_GREEN, (SCREEN_W // 2, y + 30))
        draw_text_centered(surface, "Click anywhere or press ESC to exit", font_small,
                           DIM_WHITE, (SCREEN_W // 2, SCREEN_H - 50))


# ──────────────────────────────────────────────────────────────────────
# MAIN APPLICATION
# ──────────────────────────────────────────────────────────────────────
class SmartToolkit:
    """Main application class for the Smart Toolkit prototype."""

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
        pygame.display.set_caption("MindShield - Pre-Game Anxiety Toolkit")
        self.clock = pygame.time.Clock()

        # Fonts
        self.font_title = pygame.font.SysFont("Segoe UI", 22, bold=True)
        self.font_medium = pygame.font.SysFont("Segoe UI", 17)
        self.font_small = pygame.font.SysFont("Segoe UI", 14)
        self.font_large = pygame.font.SysFont("Segoe UI", 28, bold=True)
        self.font_bubble = pygame.font.SysFont("Segoe UI", 14)
        self.font_affirmation = pygame.font.SysFont("Segoe UI", 18, bold=True)
        self.font_stats = pygame.font.SysFont("Segoe UI", 13)

        # Systems
        self.sound = SoundManager()
        self.sound.init_after_pygame()
        self.stress_analyzer = StressAnalyzer()
        self.swipe_detector = SwipeDetector()
        self.particle_system = ParticleSystem()
        self.breathing_guide = BreathingGuide()
        self.affirmation = AffirmationDisplay()
        self.mood_checkin = MoodCheckIn()
        self.combo = ComboSystem()
        self.rhythm_tap = RhythmTapExercise()
        self.session_summary = SessionSummary()

        # State
        self.app_state = STATE_MOOD_CHECKIN
        self.thoughts = []
        self.grabbed_thought = None
        self.dismissed_count = 0
        self.session_start = time.time()
        self.thought_spawn_timer = 0
        self.thought_spawn_interval = 3.0
        self.max_thoughts = 5
        self.used_thoughts = set()
        self.peak_anxiety = 0
        self.anxiety_samples = []
        self.warning_cooldown = 0

        # Pre-rendered gradient background
        self.bg_surface = pygame.Surface((SCREEN_W, SCREEN_H))
        draw_gradient_bg(self.bg_surface)

        # Don't spawn thoughts until mood check-in is done

    def _spawn_thought(self):
        """Spawn a new thought bubble with a random intrusive thought."""
        if len(self.thoughts) >= self.max_thoughts:
            return

        # Pick an unused thought if possible
        available = [t for t in INTRUSIVE_THOUGHTS if t not in self.used_thoughts]
        if not available:
            self.used_thoughts.clear()
            available = INTRUSIVE_THOUGHTS[:]

        text = random.choice(available)
        self.used_thoughts.add(text)

        bubble = ThoughtBubble(text, self.font_bubble)
        # Avoid overlap with existing thoughts
        attempts = 0
        while attempts < 20:
            overlap = False
            for other in self.thoughts:
                dx = abs(bubble.x - other.x)
                dy = abs(bubble.y - other.y)
                if dx < bubble.width * 0.7 and dy < bubble.height * 0.7:
                    overlap = True
                    break
            if not overlap:
                break
            bubble.x = random.randint(30, SCREEN_W - bubble.width - 30)
            bubble.y = random.randint(130, SCREEN_H - 260)
            bubble.base_y = bubble.y
            attempts += 1

        self.thoughts.append(bubble)

    def _handle_events(self):
        """Process all Pygame events based on current app state."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            # --- MOOD CHECK-IN STATE ---
            if self.app_state == STATE_MOOD_CHECKIN:
                if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                    return False
                self.mood_checkin.handle_event(event)
                continue

            # --- SUMMARY STATE ---
            if self.app_state == STATE_SUMMARY:
                if self.session_summary.handle_event(event):
                    return False
                continue

            # --- MAIN STATE ---
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                # Transition to summary instead of quitting
                elapsed = time.time() - self.session_start
                avg_anx = sum(self.anxiety_samples) / max(1, len(self.anxiety_samples))
                self.session_summary.show(
                    self.dismissed_count, elapsed, self.peak_anxiety,
                    avg_anx, self.stress_analyzer.anxiety_score, self.combo.best)
                self.app_state = STATE_SUMMARY
                continue

            # Rhythm tap intercepts clicks when active
            if self.rhythm_tap.active:
                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    hit = self.rhythm_tap.handle_click(*event.pos)
                    if hit:
                        self.sound.play_tap_hit()
                    else:
                        self.sound.play_tap_miss()
                continue

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mx, my = event.pos
                for thought in reversed(self.thoughts):
                    if thought.contains(mx, my):
                        thought.grabbed = True
                        thought.grab_offset = (mx - thought.x, my - thought.y)
                        self.grabbed_thought = thought
                        self.swipe_detector.start((mx, my))
                        break

            elif event.type == pygame.MOUSEMOTION:
                if self.grabbed_thought:
                    mx, my = event.pos
                    self.grabbed_thought.x = mx - self.grabbed_thought.grab_offset[0]
                    self.grabbed_thought.y = my - self.grabbed_thought.grab_offset[1]
                    self.grabbed_thought.base_y = self.grabbed_thought.y
                    self.swipe_detector.update_drag((mx, my))

            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                if self.grabbed_thought:
                    swipe_data = self.swipe_detector.end()
                    if swipe_data and swipe_data["displacement"] >= SWIPE_DISMISS_DIST:
                        self._dismiss_thought(self.grabbed_thought, swipe_data)
                    else:
                        self.grabbed_thought.grabbed = False
                        self.grabbed_thought.shake = 0
                    self.grabbed_thought = None

        return True

    def _dismiss_thought(self, thought, swipe_data):
        """Dismiss a thought bubble and trigger calming response."""
        self.stress_analyzer.record_swipe(
            swipe_data["speed"], swipe_data["duration"], swipe_data["direction_changes"])

        if thought in self.thoughts:
            self.thoughts.remove(thought)
        self.dismissed_count += 1

        # Combo system
        combo_count = self.combo.record_dismiss()

        # Particle burst — bigger burst on combos
        bx = thought.x + thought.width // 2
        by = thought.y + thought.height // 2
        burst_color = ACCENT_CYAN if self.stress_analyzer.get_level() == "calm" else ACCENT_PINK
        particle_count = 30 + (combo_count - 1) * 10 if combo_count > 1 else 30
        self.particle_system.burst(bx, by, burst_color, count=min(particle_count, 80))

        # Sound
        if combo_count >= 3:
            self.sound.play_combo()
        else:
            self.sound.play_dismiss()

        self.affirmation.show(random.choice(AFFIRMATIONS))

        # Interventions based on stress level
        score = self.stress_analyzer.anxiety_score
        if score > 65:
            self.breathing_guide.activate()
        elif 35 < score < 55 and not self.rhythm_tap.active and self.dismissed_count % 5 == 0:
            self.rhythm_tap.activate()
        elif score < 35:
            self.breathing_guide.deactivate()

    def _update(self, dt):
        """Update all systems."""
        # --- MOOD CHECK-IN ---
        if self.app_state == STATE_MOOD_CHECKIN:
            self.mood_checkin.update(dt)
            if self.mood_checkin.done and self.mood_checkin.fade_out >= 1:
                self.app_state = STATE_MAIN
                self.stress_analyzer.anxiety_score = self.mood_checkin.get_initial_anxiety()
                self.session_start = time.time()
                for _ in range(3):
                    self._spawn_thought()
            return

        # --- SUMMARY ---
        if self.app_state == STATE_SUMMARY:
            self.session_summary.update(dt)
            return

        # --- MAIN ---
        for thought in self.thoughts:
            thought.update(dt)

        # Adaptive difficulty: spawn faster at high stress
        score = self.stress_analyzer.anxiety_score
        self.thought_spawn_interval = lerp(5.0, 1.5, score / 100)

        self.thought_spawn_timer += dt
        if self.thought_spawn_timer >= self.thought_spawn_interval:
            self.thought_spawn_timer = 0
            self._spawn_thought()

        # Track peak/average anxiety
        self.peak_anxiety = max(self.peak_anxiety, score)
        self.anxiety_samples.append(score)

        # High stress warning sound
        self.warning_cooldown = max(0, self.warning_cooldown - dt)
        if score > 75 and self.warning_cooldown <= 0:
            self.sound.play_warning()
            self.warning_cooldown = 8.0  # Don't spam

        self.stress_analyzer.update(dt)
        self.particle_system.update(dt)
        self.breathing_guide.update(dt)
        self.affirmation.update(dt)
        self.combo.update(dt)
        self.rhythm_tap.update(dt)

    def _draw_header(self):
        """Draw the app header bar."""
        # Header background
        draw_rounded_rect(self.screen, DARK_PANEL[:3],
                          (0, 0, SCREEN_W, 60), 0, alpha=220)

        # App name
        draw_text_centered(self.screen, "MINDSHIELD",
                           self.font_title, ACCENT_CYAN, (SCREEN_W // 2, 22))
        draw_text_centered(self.screen, "Pre-Game Anxiety Toolkit",
                           self.font_small, DIM_WHITE, (SCREEN_W // 2, 44))

    def _draw_stress_meter(self):
        """Draw the real-time stress/anxiety meter."""
        # Panel
        panel_y = 70
        draw_rounded_rect(self.screen, DARK_PANEL[:3],
                          (20, panel_y, SCREEN_W - 40, 50), 12, alpha=180)

        # Label
        level = self.stress_analyzer.get_level()
        level_labels = {"calm": "[Calm]", "moderate": "[Moderate]", "high": "[HIGH STRESS]"}
        label_colors = {"calm": STRESS_LOW, "moderate": STRESS_MED, "high": STRESS_HIGH}
        self.screen.blit(
            self.font_small.render("Anxiety Level:", True, DIM_WHITE),
            (32, panel_y + 8),
        )
        self.screen.blit(
            self.font_small.render(level_labels[level], True, label_colors[level]),
            (150, panel_y + 8),
        )

        # Bar background
        bar_x, bar_y = 32, panel_y + 30
        bar_w = SCREEN_W - 80
        bar_h = 10
        pygame.draw.rect(self.screen, (40, 30, 70),
                         (bar_x, bar_y, bar_w, bar_h), border_radius=5)

        # Bar fill
        fill_w = int(bar_w * (self.stress_analyzer.anxiety_score / 100))
        if fill_w > 0:
            bar_color = label_colors[level]
            pygame.draw.rect(self.screen, bar_color,
                             (bar_x, bar_y, fill_w, bar_h), border_radius=5)

        # Score text
        score_text = f"{int(self.stress_analyzer.anxiety_score)}"
        self.screen.blit(
            self.font_small.render(score_text, True, WHITE),
            (bar_x + bar_w + 8, bar_y - 3),
        )

    def _draw_instructions(self):
        """Draw interaction hints at the bottom."""
        # Only show if no breathing guide is active
        if self.breathing_guide.active and self.breathing_guide.opacity > 50:
            return

        hint_y = SCREEN_H - 100
        draw_rounded_rect(self.screen, DARK_PANEL[:3],
                          (20, hint_y, SCREEN_W - 40, 85), 12, alpha=150)

        draw_text_centered(self.screen, "Click & drag thoughts to swipe them away",
                           self.font_small, DIM_WHITE,
                           (SCREEN_W // 2, hint_y + 20))
        draw_text_centered(self.screen, "Swipe speed & pattern reveal your stress level",
                           self.font_stats, (*ACCENT_PURPLE,),
                           (SCREEN_W // 2, hint_y + 42))

        # Session stats
        elapsed = time.time() - self.session_start
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        stats = f"Dismissed: {self.dismissed_count}  |  Session: {mins}:{secs:02d}"
        draw_text_centered(self.screen, stats,
                           self.font_stats, (*DIM_WHITE,),
                           (SCREEN_W // 2, hint_y + 64))

    def _draw(self):
        """Render everything based on current state."""
        # --- MOOD CHECK-IN ---
        if self.app_state == STATE_MOOD_CHECKIN:
            self.screen.blit(self.bg_surface, (0, 0))
            self.mood_checkin.draw(self.screen, self.font_large, self.font_medium,
                                  self.font_small)
            pygame.display.flip()
            return

        # --- SUMMARY ---
        if self.app_state == STATE_SUMMARY:
            self.session_summary.draw(self.screen, self.font_large, self.font_medium,
                                      self.font_small, self.bg_surface)
            pygame.display.flip()
            return

        # --- MAIN ---
        self.screen.blit(self.bg_surface, (0, 0))

        for thought in self.thoughts:
            thought.draw(self.screen)

        self.particle_system.draw(self.screen)
        self.affirmation.draw(self.screen, self.font_affirmation)

        self._draw_header()
        self._draw_stress_meter()
        self._draw_instructions()

        # Combo display
        self.combo.draw(self.screen, self.font_title)

        # Overlays
        self.breathing_guide.draw(self.screen, self.font_large, self.font_medium)
        self.rhythm_tap.draw(self.screen, self.font_medium, self.font_small)

        pygame.display.flip()

    def run(self):
        """Main game loop."""
        running = True
        while running:
            dt = self.clock.tick(FPS) / 1000.0
            dt = min(dt, 0.05)
            running = self._handle_events()
            self._update(dt)
            self._draw()

        pygame.quit()
        sys.exit()


# ──────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  MindShield - Pre-Game Anxiety Toolkit")
    print("  Intrusive Thought Dismisser for Competitive Gamers")
    print("=" * 55)
    print()
    print("  HOW TO USE:")
    print("  - Click and drag thought bubbles to swipe them away")
    print("  - Swipe speed & pattern are analyzed for stress level")
    print("  - Calming animations activate at high stress")
    print("  - Press ESC to exit")
    print()
    app = SmartToolkit()
    app.run()
