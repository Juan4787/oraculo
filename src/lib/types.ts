export type WorkspaceRole = 'owner' | 'staff' | 'client';

export type Workspace = {
	id: string;
	name: string;
	slug: string | null;
};

