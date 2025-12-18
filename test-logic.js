
const demoCards = [
    {
        id: 'demo-card-miguel',
        name: 'Arcángel Miguel',
        image_path: '/cards/arcangel-miguel.png',
    },
    {
        id: 'demo-card-gabriel',
        name: 'Arcángel Gabriel',
        image_path: '/cards/arcangel-gabriel.png',
    },
    {
        id: 'demo-card-rafael',
        name: 'Arcángel Rafael',
        image_path: '/cards/arcangel-rafael.png',
    },
    {
        id: 'demo-card-uriel',
        name: 'Arcángel Uriel',
        image_path: '/cards/arcangel-uriel.png',
    },
    {
        id: 'demo-card-metatron',
        name: 'Arcángel Metatrón',
        image_path: '/cards/arcangel-metatron.png',
    }
];

const messageImages = {
    'arcangel-rafael': [
        '/cards/message-rafael-1.png',
        '/cards/message-rafael-2.png',
        '/cards/message-rafael-3.png'
    ],
    'arcangel-miguel': ['/cards/message-miguel-1.png'],
    'arcangel-gabriel': ['/cards/message-gabriel-1.png'],
    'arcangel-uriel': ['/cards/message-uriel-1.png'],
    'arcangel-metatron': ['/cards/arcangel-metatron-reverso.png']
};

const arcangeles = ['rafael', 'gabriel', 'miguel', 'uriel', 'metatron'];

function slugify(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function ensureArcangelPrefix(slug) {
    if (!slug) return '';
    return slug.startsWith('arcangel-') ? slug : `arcangel-${slug}`;
}

function slugFromPath(path) {
    const filename = path.split('/').pop() ?? '';
    const base = filename.replace(/\.[^/.]+$/, '');
    return slugify(base);
}

function detectArcangel(item) {
    const path = item?.image_path ?? '';
    const name = item?.name ?? '';

    const candidates = [slugify(path), slugify(slugFromPath(path)), slugify(name)];
    console.log(`Candidates for ${name}:`, candidates);
    for (const candidate of candidates) {
        for (const arc of arcangeles) {
            if (candidate.includes(arc)) {
                return ensureArcangelPrefix(arc);
            }
        }
    }

    return '';
}

console.log('--- Testing Detection ---');
demoCards.forEach((card, index) => {
    const slug = detectArcangel(card);
    console.log(`Card: ${card.name} -> Slug: ${slug}`);

    if (messageImages[slug]) {
        console.log(`  Has images: Yes (${messageImages[slug].length})`);
    } else {
        console.log(`  Has images: NO (Slug: ${slug})`);
    }
});
