/**
 * ARENA CLASH — Authoritative Character Definitions
 * 
 * These stats are the ONLY source of truth for gameplay balance.
 * The client receives character type on join but never modifies stats.
 */

export const CHARACTERS = {
    gopnik: {
        id: 'gopnik',
        name: 'Гопник',
        type: 'melee',
        weapon: 'knife',

        // Combat stats
        maxHp: 100,
        speed: 220,          // pixels per second
        damage: 35,
        attackRange: 60,     // pixels from center
        attackArc: Math.PI / 2, // 90 degree arc in front
        cooldownMs: 50,     // milliseconds between attacks

        // Hitbox
        radius: 18,
        hitboxWidth: 36,
        hitboxHeight: 36,
    },

    armor: {
        id: 'armor',
        name: 'Армор',
        type: 'ranged',
        weapon: 'cannon',

        // Combat stats
        maxHp: 120,
        speed: 160,
        damage: 50,
        attackRange: 800,     // max projectile travel distance
        projectileSpeed: 600, // pixels per second
        projectileRadius: 8,
        cooldownMs: 50,     // 5 second reload

        // Hitbox
        radius: 22,
        hitboxWidth: 44,
        hitboxHeight: 44,
    },

    godzilla: {
        id: 'godzilla',
        name: 'Годзилла',
        type: 'aoe',
        weapon: 'fire_breath',

        // Combat stats
        maxHp: 150,
        speed: 140,
        damage: 30,
        attackRange: 200,            // fire breath reach
        attackArc: Math.PI / 3,      // 60 degree cone
        cooldownMs: 50,            // 2 second reload

        // Hitbox
        radius: 26,
        hitboxWidth: 52,
        hitboxHeight: 52,
    },

    samurai: {
        id: 'samurai',
        name: 'Самурай',
        type: 'melee',
        weapon: 'katana',

        // Combat stats
        maxHp: 80,
        speed: 350,          // Very fast (like A-Train)
        damage: 40,
        attackRange: 70,     // pixels from center
        attackArc: Math.PI,  // 180 degree arc (wide sweep)
        cooldownMs: 40,      // Fast attacks

        // Hitbox
        radius: 18,
        hitboxWidth: 36,
        hitboxHeight: 36,
    },
};

/** Valid character IDs for input validation */
export const VALID_CHARACTER_IDS = Object.keys(CHARACTERS);

export default CHARACTERS;
