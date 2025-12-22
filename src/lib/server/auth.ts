import { env } from '$env/dynamic/private';

export const MASTER_EMAIL = (env.MASTER_EMAIL ?? '').trim().toLowerCase();

export const isMasterEmail = (email?: string | null) =>
	Boolean(email && MASTER_EMAIL && email.trim().toLowerCase() === MASTER_EMAIL);
