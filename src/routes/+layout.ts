import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { LayoutLoad } from './$types';
import { supabase } from '#lib/utils.js';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
	const isLoginPage = url.pathname === '/login';

	let user;
	try {
		const { data, error } = await supabase.auth.getUser();
		user = !error && data.user ? data.user : null;
	} catch {
		user = null;
	}

	// If unauthenticated and trying to access a protected route, redirect to /login
	if (!user && !isLoginPage) {
		redirect(307, resolve('/login'));
	}

	return {
		user
	};
};
