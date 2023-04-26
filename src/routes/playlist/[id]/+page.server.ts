import { SPOTIFY_BASE_URL } from '$env/static/private';
import { fail, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	followPlaylist: async ({ cookies, params, fetch }) => {
		const res = await fetch(`${SPOTIFY_BASE_URL}/playlists/${params.id}/followers`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${cookies.get('access_token')}`
			}
		});
		if (!res.ok) {
			return fail(res.status, { followError: res.statusText, followForm: true });
		}
	},
	unFollowPlaylist: async ({ cookies, params, fetch }) => {
		const res = await fetch(`${SPOTIFY_BASE_URL}/playlists/${params.id}/followers`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${cookies.get('access_token')}`
			}
		});
		if (!res.ok) {
			return fail(res.status, { followError: res.statusText, followForm: true });
		}
	}
};
