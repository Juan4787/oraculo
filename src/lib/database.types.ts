export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			workspace_members: {
				Row: {
					workspace_id: string;
					user_id: string;
					role: 'owner' | 'staff' | 'client';
					created_at: string;
				};
				Insert: {
					workspace_id: string;
					user_id: string;
					role: 'owner' | 'staff' | 'client';
					created_at?: string;
				};
				Update: {
					workspace_id?: string;
					user_id?: string;
					role?: 'owner' | 'staff' | 'client';
					created_at?: string;
				};
				Relationships: [];
			};
			workspaces: {
				Row: {
					id: string;
					name: string;
					slug: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					slug?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					slug?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			decks: {
				Row: {
					id: string;
					workspace_id: string;
					name: string;
					description: string | null;
					status: 'draft' | 'published';
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					name: string;
					description?: string | null;
					status?: 'draft' | 'published';
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					name?: string;
					description?: string | null;
					status?: 'draft' | 'published';
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			cards: {
				Row: {
					id: string;
					workspace_id: string;
					deck_id: string | null;
					name: string;
					image_path: string | null;
					short_message: string;
					meaning: string;
					meaning_extended: string | null;
					status: 'draft' | 'published';
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					deck_id?: string | null;
					name: string;
					image_path?: string | null;
					short_message: string;
					meaning: string;
					meaning_extended?: string | null;
					status?: 'draft' | 'published';
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					deck_id?: string | null;
					name?: string;
					image_path?: string | null;
					short_message?: string;
					meaning?: string;
					meaning_extended?: string | null;
					status?: 'draft' | 'published';
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			spreads: {
				Row: {
					id: string;
					workspace_id: string;
					name: string;
					card_count: number;
					status: 'draft' | 'published';
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					name: string;
					card_count: number;
					status?: 'draft' | 'published';
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					name?: string;
					card_count?: number;
					status?: 'draft' | 'published';
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			spread_positions: {
				Row: {
					id: string;
					spread_id: string;
					position_index: number;
					title: string;
					description: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					spread_id: string;
					position_index: number;
					title: string;
					description?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					spread_id?: string;
					position_index?: number;
					title?: string;
					description?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			persons: {
				Row: {
					id: string;
					workspace_id: string;
					created_by_user_id: string;
					name: string;
					notes: string | null;
					tags: string[];
					archived: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					created_by_user_id: string;
					name: string;
					notes?: string | null;
					tags?: string[];
					archived?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					created_by_user_id?: string;
					name?: string;
					notes?: string | null;
					tags?: string[];
					archived?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			readings: {
				Row: {
					id: string;
					workspace_id: string;
					owner_type: 'user' | 'person';
					owner_user_id: string | null;
					owner_person_id: string | null;
					created_by_user_id: string | null;
					spread_id: string;
					selected_deck_ids: string[] | null;
					random_seed: string;
					note: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					owner_type: 'user' | 'person';
					owner_user_id?: string | null;
					owner_person_id?: string | null;
					created_by_user_id?: string | null;
					spread_id: string;
					selected_deck_ids?: string[] | null;
					random_seed: string;
					note?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					owner_type?: 'user' | 'person';
					owner_user_id?: string | null;
					owner_person_id?: string | null;
					created_by_user_id?: string | null;
					spread_id?: string;
					selected_deck_ids?: string[] | null;
					random_seed?: string;
					note?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			reading_items: {
				Row: {
					id: string;
					reading_id: string;
					position_index: number;
					card_id: string;
					snapshot: Json;
					created_at: string;
				};
				Insert: {
					id?: string;
					reading_id: string;
					position_index: number;
					card_id: string;
					snapshot: Json;
					created_at?: string;
				};
				Update: {
					id?: string;
					reading_id?: string;
					position_index?: number;
					card_id?: string;
					snapshot?: Json;
					created_at?: string;
				};
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: {
			redeem_access_code: {
				Args: { access_code: string };
				Returns: { workspace_id: string; role: 'owner' | 'staff' | 'client' }[];
			};
			create_reading: {
				Args: {
					workspace_id: string;
					spread_id: string;
					owner_type: 'user' | 'person';
					owner_person_id?: string | null;
					selected_deck_ids?: string[] | null;
				};
				Returns: { reading_id: string }[];
			};
		};
		Enums: {
			workspace_role: 'owner' | 'staff' | 'client';
			content_status: 'draft' | 'published';
			reading_owner_type: 'user' | 'person';
		};
		CompositeTypes: Record<string, never>;
	};
};

