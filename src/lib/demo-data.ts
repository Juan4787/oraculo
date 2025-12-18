type DemoPerson = {
	id: string;
	name: string;
	notes: string | null;
	tags: string[];
	archived: boolean;
	created_at: string;
};

const demoPersons: DemoPerson[] = [
	{
		id: 'demo-1',
		name: 'Ana (demo)',
		notes: 'Ejemplo de notas privadas',
		tags: ['demo', 'paciente'],
		archived: false,
		created_at: new Date().toISOString()
	},
	{
		id: 'demo-2',
		name: 'Pareja (demo)',
		notes: null,
		tags: ['amor'],
		archived: false,
		created_at: new Date().toISOString()
	}
];

const uuid = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'demo-' + Math.random().toString(16).slice(2);
};

export function getDemoPersons() {
	return demoPersons.slice().filter((p) => !p.archived);
}

export function findDemoPerson(id: string) {
	return demoPersons.find((p) => p.id === id) ?? null;
}

export function addDemoPerson(input: { name: string; notes: string | null; tags: string[] }) {
	const person: DemoPerson = {
		id: uuid(),
		name: input.name,
		notes: input.notes,
		tags: input.tags,
		archived: false,
		created_at: new Date().toISOString()
	};
	demoPersons.unshift(person);
	return person;
}

export function updateDemoPerson(id: string, data: { name: string; notes: string | null; tags: string[] }) {
	const person = demoPersons.find((p) => p.id === id);
	if (!person) return null;
	person.name = data.name;
	person.notes = data.notes;
	person.tags = data.tags;
	return person;
}

export function archiveDemoPerson(id: string) {
	const person = demoPersons.find((p) => p.id === id);
	if (!person) return null;
	person.archived = true;
	return person;
}
