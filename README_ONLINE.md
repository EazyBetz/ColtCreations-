# Godforged online and arena update

The live game remains at https://eazybetz.github.io/ColtCreations-/.
The account API is https://godforged-online-colton.jocundfrog24.chatgpt.site, backed by a separate Sites Worker and D1 database.

## Player flow

Open Friends and create a username/password profile. Copy and save the permanent GF code. Sign in on another device with that code and password; username changes never regenerate the code. Password reset by email is not implemented.

Add another code, accept the request, then message or invite the friend. Accepted friends can block/remove each other. To play together, accept the party invitation, press Connect on both devices, then the host presses Start Co-op Match. This is private two-player co-op against AI, not public matchmaking or 5v5.

The host runs the shared simulation; the guest replaces one allied AI. Basic attacks, regional abilities, movement, health, death/respawn and match outcome are synchronized. The guest uses base equipment; shopping and recall are host-only in this first co-op release. Return to the sanctuary to heal. The host must keep the battle open. Direct WebRTC uses STUN without a TURN relay, so some mobile/carrier or restricted networks cannot connect. Disconnect stops the match; start a fresh solo match from Play.

## Checks

Run gameplay.test.mjs, combat.test.mjs and coop.test.mjs with a local Three.js r170 module path. The co-op test uses separate VM game instances and verifies movement, replicated combat, damage cooldowns and disconnect. social-api.test.py exercises live separate test accounts, request acceptance, private-message delivery, isolation, signaling, blocking and logout. Actual two-phone rendering and network performance require device testing.

## World changes

Removed overlapping starting-floor layers and replaced square water pools with connected curved streams and animated bump textures. Added seven bridge crossings in total, perimeter colonnades, crimson banners and braziers. Standard minions use 0.28 model scale; vanguards use 0.40, below the gods' full scale. Base spacing remains unchanged.
