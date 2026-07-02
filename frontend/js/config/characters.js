/**
 * ARENA CLASH — Client-side Character Definitions
 * 
 * Visual data, descriptions, and UI info for character selection.
 * NO authoritative stats — those are server-only.
 * Display stats are approximate (for UI cards only).
 */

export const CHARACTER_DATA = {
    gopnik: {
        id: 'gopnik',
        name: 'Гопник',
        nameEn: 'Gopnik',
        type: 'Ближний бой',
        typeEn: 'Melee',
        weapon: 'Кинжал',
        weaponEn: 'Knife',
        description: 'Быстрый и смертоносный боец ближнего боя. Наносит мощные удары кинжалом с молниеносной скоростью. Высокая скорость позволяет быстро сближаться с врагами.',
        descriptionEn: 'Fast and deadly melee fighter. Delivers powerful knife strikes with lightning speed.',

        // Display stats (approximate, for UI only — NOT authoritative)
        displayStats: {
            hp: 3,        // out of 5
            speed: 5,
            damage: 4,
            range: 1,
            cooldown: 5,  // 5 = fastest
        },

        // Visual
        color: 0xe74c3c,        // Red
        accentColor: 0xff6b6b,
        glowColor: '#e74c3c',
        iconEmoji: '🔪',

        // Sprite animation config
        spriteConfig: {
            bodyColor: 0xe74c3c,
            outlineColor: 0xc0392b,
            weaponColor: 0xbdc3c7,
            size: 36,
        },
    },

    armor: {
        id: 'armor',
        name: 'Армор',
        nameEn: 'Armor',
        type: 'Стрелок',
        typeEn: 'Ranged',
        weapon: 'Футуристическая пушка',
        weaponEn: 'Futuristic Cannon',
        description: 'Тяжело бронированный стрелок с мощной пушкой. Один выстрел наносит колоссальный урон, но долгая перезарядка требует точности. Каждый выстрел решает судьбу боя.',
        descriptionEn: 'Heavily armored shooter with a powerful cannon. One shot deals massive damage.',

        displayStats: {
            hp: 4,
            speed: 2,
            damage: 5,
            range: 5,
            cooldown: 1,
        },

        color: 0x3498db,
        accentColor: 0x5dade2,
        glowColor: '#3498db',
        iconEmoji: '🔫',

        spriteConfig: {
            bodyColor: 0x3498db,
            outlineColor: 0x2980b9,
            weaponColor: 0x2c3e50,
            size: 44,
        },
    },

    godzilla: {
        id: 'godzilla',
        name: 'Годзилла',
        nameEn: 'Godzilla',
        type: 'Сплэш-урон',
        typeEn: 'AoE Splash',
        weapon: 'Огненное дыхание',
        weaponEn: 'Fire Breath',
        description: 'Гигантский монстр с разрушительным огненным дыханием. Атакует по площади, сжигая всех врагов в широком конусе перед собой. Высокое здоровье делает его настоящим танком.',
        descriptionEn: 'Giant monster with devastating fire breath. Attacks in AoE, burning enemies in a wide cone.',

        displayStats: {
            hp: 5,
            speed: 1,
            damage: 3,
            range: 3,
            cooldown: 3,
        },

        color: 0x2ecc71,
        accentColor: 0x58d68d,
        glowColor: '#2ecc71',
        iconEmoji: '🔥',

        spriteConfig: {
            bodyColor: 0x2ecc71,
            outlineColor: 0x27ae60,
            weaponColor: 0xe67e22,
            size: 52,
        },
    },
};

/** Ordered list for character selection UI */
export const CHARACTER_ORDER = ['gopnik', 'armor', 'godzilla'];

export default CHARACTER_DATA;
