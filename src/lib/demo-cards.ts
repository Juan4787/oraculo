export type DemoCard = {
	id: string;
	name: string;
	image_path: string;
	short_message: string;
	meaning: string;
	meaning_extended: string | null;
};

export const demoDeck = { id: 'demo-deck-arcangeles', name: 'Arcángeles' } as const;

export const demoCards: DemoCard[] = [
	{
		id: 'demo-card-miguel',
		name: 'Arcángel Miguel',
		image_path: '/cards/arcangel-miguel.png',
		short_message: 'Protección y fortaleza',
		meaning: 'Pedí protección y avanzá con coraje. Estás siendo guiada/o hacia lo correcto.',
		meaning_extended:
			'Marcá límites, soltá el miedo y tomá una decisión clara. La energía te acompaña para actuar con firmeza y amor.'
	},
	{
		id: 'demo-card-gabriel',
		name: 'Arcángel Gabriel',
		image_path: '/cards/arcangel-gabriel.png',
		short_message: 'Mensaje y claridad',
		meaning: 'Tu intuición trae una señal. Decí tu verdad con suavidad y precisión.',
		meaning_extended:
			'Es buen momento para comunicar, crear o pedir ayuda. Prestá atención a sueños, sincronías y conversaciones clave.'
	},
	{
		id: 'demo-card-rafael',
		name: 'Arcángel Rafael',
		image_path: '/cards/arcangel-rafael.png',
		short_message: 'Sanación y bienestar',
		meaning: 'Cuidá tu energía y tu cuerpo. La sanación está en marcha.',
		meaning_extended:
			'Bajá el ritmo, priorizá hábitos que te nutran y aceptá apoyo. La recuperación se acelera cuando te tratás con ternura.'
	},
	{
		id: 'demo-card-uriel',
		name: 'Arcángel Uriel',
		image_path: '/cards/arcangel-uriel.png',
		short_message: 'Sabiduría y solución',
		meaning: 'Una idea práctica aparece. Confiá en tu capacidad de resolver.',
		meaning_extended:
			'Buscá una respuesta simple y accionable. Orden, foco y un paso a la vez: ahí está la llave.'
	},
	{
		id: 'demo-card-metatron',
		name: 'Arcángel Metatrón',
		image_path: '/cards/arcangel-metatron.png',
		short_message: 'Propósito y alineación',
		meaning: 'Volvé a tu centro. Elegí lo que te eleva y te ordena.',
		meaning_extended:
			'Priorizá lo esencial, soltá distracciones y escuchá tu llamado. Cuando te alineás, el camino se abre con claridad.'
	}
];

const demoBackOptions: Record<string, string[]> = {
	'arcangel-rafael': [
		'/cards/arcangel-rafael-reverso.png',
		'/cards/message-rafael-1.png',
		'/cards/message-rafael-2.png',
		'/cards/message-rafael-3.png'
	],
	'arcangel-gabriel': ['/cards/arcangel-gabriel-reverso.png', '/cards/message-gabriel-1.png'],
	'arcangel-uriel': [
		'/cards/arcangel-uriel-reverso.png',
		'/cards/arcangel-uriel-reverso-2.png',
		'/cards/message-uriel-1.png',
		'/cards/message-uriel-2.png'
	]
};

function slugFromPath(path: string) {
	const filename = path.split('/').pop() ?? '';
	return filename.replace(/\.[^/.]+$/, '');
}

export type DemoBackPick = {
	card: DemoCard;
	back_image_path: string;
};

export const demoBackPool: DemoBackPick[] = demoCards.flatMap((card) => {
	const slug = slugFromPath(card.image_path);
	const options = demoBackOptions[slug] ?? [];
	return options.map((back_image_path) => ({ card, back_image_path }));
});

function fnv1a32(input: string) {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

function mulberry32(seed: number) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let x = Math.imul(t ^ (t >>> 15), 1 | t);
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

export function pickRandomUniqueWithSeed<T>(input: readonly T[], count: number, seed: string) {
	const n = Math.max(0, Math.min(Math.floor(count), input.length));
	if (n === 0) return [];
	if (input.length <= 1) return input.slice(0, n);

	const rng = mulberry32(fnv1a32(seed));
	const array = input.slice();

	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array.slice(0, n);
}

export function pickRandomDemoBacksWithSeed(count: number, seed: string) {
	return pickRandomUniqueWithSeed(demoBackPool, count, seed);
}

export function makeDemoSignedUrls(paths: Array<string | null | undefined>) {
	const result: Record<string, string> = {};
	for (const path of paths) {
		if (!path) continue;
		const value = String(path).trim();
		if (!value) continue;
		result[value] = value;
	}
	return result;
}
