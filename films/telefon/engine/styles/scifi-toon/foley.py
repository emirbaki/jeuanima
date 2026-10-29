"""scifi-toon · foley.py: cartoon sounds, all synthesized. SOUNDS[type](ev) -> mono float array at 48 kHz.
Unknown types stay silent (mix.py prints a warning). Uses the helpers in ~/lemo-opuscar/core/audio/sfx.py."""
import os, sys
import numpy as np
LIB = os.environ.get('LEMO_OPUSCAR_HOME') or os.path.join(os.path.expanduser('~'), 'lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, click, whoosh, thump, pop, ding

rng = np.random.default_rng(5)
def sweep(f0, f1, d, curve=1.0):
    x = t_(d); f = f0 * (f1 / f0) ** ((x / d) ** curve); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def nz(d): return rng.standard_normal(len(t_(d)))

def slide(e): d = .28; return norm(bp(nz(d), 800, 3000) * np.sin(np.pi * t_(d) / d) ** 2) * .6
def gulp(e): d = .22; x = sweep(420, 110, d, .6) * env_exp(d, .07); return norm(lp(x, 1200))
def paper(e): d = .35; return norm(bp(nz(d), 2000, 8000) * (np.abs(np.sin(t_(d) * 60)) ** 3) * np.sin(np.pi * t_(d) / d)) * .6
def cloth(e): d = .3; return norm(lp(nz(d), 1500) * np.sin(np.pi * t_(d) / d) ** 2) * .7
def flutter(e): d = 1.2; return norm(bp(nz(d), 300, 1500) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 22 * t_(d)))) * np.sin(np.pi * t_(d) / d)) * .4
def blip(e): d = .09; return norm(sweep(900, 1800, d) * env_exp(d, .04)) * .5
def squeak(e): d = .12; x = t_(d); return norm(np.sin(2 * np.pi * (1800 + 600 * np.sin(2 * np.pi * 25 * x)) * x) * np.sin(np.pi * x / d)) * .45
def boing(e): d = .6; x = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(180 + 120 * np.sin(2 * np.pi * 9 * x) * np.exp(-x / .25)) / SR) * env_exp(d, .25))
def clank(e): d = .5; x = t_(d); return norm(sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .12) for f in (420, 1130, 1780)) + bp(nz(d), 1000, 5000) * env_exp(d, .01))
def beep(e): d = .25; y = np.zeros(len(t_(d))); b = np.sin(2 * np.pi * 1320 * t_(.08)) * env_exp(.08, .05); y[:len(b)] += b; y[int(.12 * SR):int(.12 * SR) + len(b)] += b * .8; return y * .5
def rub(e): d = 1.4; return norm(bp(nz(d), 1500, 6000) * (np.abs(np.sin(2 * np.pi * 6 * t_(d))) ** 2)) * .5
def portal_open(e):
    d = 1.6; x = t_(d)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-x / .12)) / SR) * env_exp(d, .45)
    swirl = np.sin(2 * np.pi * np.cumsum(260 + 500 * (x / d) + 120 * np.sin(2 * np.pi * 7 * x)) / SR) * np.sin(np.pi * x / d) * .35
    return norm(boom + lp(nz(d), 3000) * env_exp(d, .3) * .5 + swirl)
def cough(e):
    y = np.zeros(int(1.0 * SR))
    for k, at in enumerate((0, .28, .5)):
        d = .18; c = lp(nz(d), 1800 - k * 300) * env_exp(d, .05) + sweep(260, 180, d) * env_exp(d, .05) * .3
        y[int(at * SR):int(at * SR) + len(c)] += c
    return norm(y) * .8
def sparkle(e):
    y = np.zeros(int(.9 * SR))
    for k in range(6):
        f = 2000 + rng.random() * 3000; d = .25; b = np.sin(2 * np.pi * f * t_(d)) * env_exp(d, .06); a = int(k * .12 * SR); y[a:a + len(b)] += b
    return norm(y) * .4
def snap(e): d = .08; return norm(hp(nz(d), 2000) * env_exp(d, .008))
def kazoo(e):
    d = .9; x = t_(d); f = np.where(x < .3, 520, np.where(x < .55, 470, 390)) * (1 + .01 * np.sin(2 * np.pi * 6 * x))
    ph = np.cumsum(f) / SR; s = np.sign(np.sin(2 * np.pi * ph)) * .6 + np.sin(4 * np.pi * ph) * .3
    return norm(bp(s, 300, 3500) * np.minimum(1, x / .02) * np.minimum(1, (d - x) / .1)) * .7

def clink(e):
    d = .35; x = t_(d); return norm(sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .07) for f in (2350, 3720, 5100)))
def zip_(e):
    d = .32; x = t_(d); teeth = (np.sin(2 * np.pi * (60 + 140 * x / d) * x) > .6).astype(float)
    return norm(bp(nz(d), 2500, 9000) * teeth * np.sin(np.pi * x / d)) * .6
def poof(e):
    d = .45; x = t_(d); return norm(lp(nz(d), 1400) * np.minimum(1, x / .015) * np.exp(-x / .12) + sweep(300, 120, d) * np.exp(-x / .08) * .3) * .8
def plink(e):
    d = .5; x = t_(d); return norm(sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .15) / (k + 1) for k, f in enumerate((1047, 2094, 3140)))) * .7
def bonk(e):
    d = .25; x = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(420 * np.exp(-x / .05) + 160) / SR) * np.exp(-x / .07) + bp(nz(d), 800, 3000) * np.exp(-x / .01) * .5)
def whistle(f0, f1, d=.6):
    x = t_(d); f = f0 * (f1 / f0) ** (x / d) * (1 + .012 * np.sin(2 * np.pi * 6 * x))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, x / .03) * np.minimum(1, (d - x) / .05) + bp(nz(d), 1500, 5000) * .04) * .6
def honk(e):
    d = .35; x = t_(d); ph = np.cumsum(np.full(len(x), 330.)) / SR; s = np.sign(np.sin(2 * np.pi * ph)) + .5 * np.sign(np.sin(2 * np.pi * ph * 1.5))
    return norm(bp(s, 250, 2500) * np.minimum(1, x / .01) * np.minimum(1, (d - x) / .04)) * .6
def wobble(e):
    d = .7; x = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(220 + 90 * np.sin(2 * np.pi * 11 * x)) / SR) * np.sin(np.pi * x / d)) * .5
def crash(e):
    d = 1.6; x = t_(d); return norm(hp(nz(d), 3000) * np.exp(-x / .5) + bp(nz(d), 300, 1200) * np.exp(-x / .05)) * .7
def tada(e):
    d = .9; x = t_(d); y = np.zeros(len(x))
    for k, (f, a) in enumerate(((523, 0), (659, .12))):
        n = len(x) - int(a * SR); xx = t_(n / SR); ph = np.cumsum(np.full(n, f)) / SR
        y[int(a * SR):] += lp((2 * (ph % 1) - 1) + .5 * (2 * ((ph * 1.5) % 1) - 1), 2500) * np.minimum(1, xx / .02) * np.exp(-xx / (.12 if k == 0 else .5))
    return norm(y) * .6
def swish(e):
    d = .22; x = t_(d); return norm(bp(nz(d), 1200, 7000) * np.sin(np.pi * x / d) ** 2) * .5

SOUNDS = {
    'slide': slide, 'gulp': gulp, 'paper': paper, 'cloth': cloth, 'flutter': flutter, 'blip': blip, 'squeak': squeak,
    'pop': lambda e: norm(pop(1.0)), 'thump': lambda e: norm(thump(1.0, 55)), 'whoosh': lambda e: norm(whoosh(.35)),
    'boing': boing, 'clank': clank, 'beep': beep, 'rub': rub, 'portal_open': portal_open, 'cough': cough,
    'sparkle': sparkle, 'snap': snap, 'kazoo': kazoo, 'ding': lambda e: norm(ding(1.0)),
    'clink': clink, 'zip': zip_, 'poof': poof, 'plink': plink, 'bonk': bonk, 'honk': honk, 'wobble': wobble,
    'whistle_up': lambda e: whistle(500, 1500), 'whistle_down': lambda e: whistle(1600, 420, .7),
    'crash': crash, 'tada': tada, 'swish': swish,
    'scratch': lambda e: norm(bp(nz(.45), 600, 5000) * np.abs(np.sin(2 * np.pi * np.cumsum(9 + 30 * t_(.45)) / SR)) ** 2 + sweep(900, 140, .45, .5) * .5) * .8,
    'click': lambda e: norm(click(1.2)) * .7, 'creak': lambda e: norm(lp(sweep(180, 120, .5) * (np.abs(np.sin(2 * np.pi * 30 * t_(.5))) ** 4), 2500)) * .6,
}
