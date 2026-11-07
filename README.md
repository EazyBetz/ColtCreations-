# Godforged Phase 30 — Tower Territory & Minion Combat

Built directly from the uploaded Phase 29 Black Screen Fix. Preserves all previous files, map, abilities, character creator, and shop.

Changes in phase21.js:
- Tower courtyards use visibly different large, wedge-arranged dark stonework and an orange perimeter marker.
- Towers acquire targets only within the 19-world-unit stone perimeter, prioritize allied minions, and fire visible travelling bolts. A projectile already launched can still hit after exiting.
- Archer minions fire visible travelling arrows instead of instant invisible damage.
- Swordsman minions swing a visible blade during attacks, with a small torso turn.
- Enemy minion damage remains low (5 ranged / 7 melee).

Limitations: minion animation is procedural (not skeletal); visual validation on iPhone is still required. Projectiles aim at the target's position at firing time and may miss moving players. This is an original MOBA implementation, not SMITE source code.
