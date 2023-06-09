<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { ItemPage, Tracklist, Button, Pagination } from '$components';
	import { page } from '$app/stores';
	import { Heart } from 'lucide-svelte';
	import { applyAction, enhance } from '$app/forms';
	import { toasts } from '$stores';
	import Modal from '$components/Modal.svelte';
	import Micromodal from 'micromodal';
	import PlaylistForm from '$components/PlaylistForm.svelte';
	import type { ActionData as EditActionData } from './edit/$types';
	import { invalidate, invalidateAll } from '$app/navigation';

	export let data: PageData;
	export let form: ActionData | EditActionData;

	$: playlist = data.playlist;
	$: color = data.color;
	$: tracks = data.playlist.tracks;
	$: isFollowing = data.isFollowing;
	$: currentPage = $page.url.searchParams.get('page') || 1;

	let filteredTracks: SpotifyApi.TrackObjectFull[];
	let isLoading = false;
	let isLoadingFollow = false;
	let followButon: Button<'button'>;

	$: {
		filteredTracks = [];
		tracks.items.forEach((item) => {
			if (item.track) filteredTracks = [...filteredTracks, item.track];
		});
	}

	const followersFormat = Intl.NumberFormat('en', { notation: 'compact' });

	const loadMoreTracks = async () => {
		if (!tracks.next) return;
		isLoading = true;
		const res = await fetch(tracks.next.replace('https://api.spotify.com/v1/', '/api/spotify/'));
		const resJSON = await res.json();
		if (res.ok) {
			tracks = { ...resJSON, items: [...tracks.items, ...resJSON.items] };
		} else {
			toasts.error(resJSON.error.message || 'Could not load data');
		}
		isLoading = false;
	};
</script>

<ItemPage
	title={playlist.name}
	type={playlist.type}
	{color}
	image={playlist.images.length > 0 ? playlist.images[0].url : undefined}
>
	<div slot="meta">
		<p class="playlist-description">{@html playlist.description}</p>
		<p class="meta">
			<span>{playlist.owner.display_name}</span>
			<span>{followersFormat.format(playlist.followers.total)} Followers</span>
			<span>{playlist.tracks.total} Tracks</span>
		</p>
	</div>

	<div class="playlist-actions">
		{#if data.user?.id === playlist.owner.id}
			<Button
				element="a"
				variant="outline"
				href="/playlist/{playlist.id}/edit"
				on:click={(e) => {
					e.preventDefault();
					Micromodal.show('edit-playlist-modal');
				}}>Edit playlist</Button
			>
		{:else if isFollowing !== null}
			<form
				action={`?/${isFollowing ? 'unFollowPlaylist' : 'followPlaylist'}`}
				class="follow-form"
				method="POST"
				use:enhance={() => {
					isLoadingFollow = true;
					return async ({ result }) => {
						isLoadingFollow = false;

						if (result.type === 'success') {
							await applyAction(result);
							isFollowing = !isFollowing;
						} else if (result.type === 'failure') {
							toasts.error(result.data?.followError);
						} else {
							await applyAction(result);
						}

						followButon.focus();
						invalidateAll();
					};
				}}
			>
				<Button
					bind:this={followButon}
					element="button"
					type="submit"
					variant="outline"
					disabled={isLoadingFollow}
				>
					<Heart aria-hidden focusable="false" fill={isFollowing ? 'var(--text-color)' : 'none'} />
					{isFollowing ? 'Unfollow' : 'Follow'}
					<span class="visually-hidden">{playlist.name} playlist</span></Button
				>
				{#if form && 'followForm' in form && form?.followError}
					<p class="error">{form.followError}</p>
				{/if}
			</form>
		{/if}
	</div>

	{#if playlist.tracks.items.length > 0}
		<Tracklist
			tracks={filteredTracks}
			isOwner={data.user?.id === playlist.owner.id}
			userPlaylists={data.userAllPlaylists?.filter((pl) => pl.owner.id === data.user?.id)}
			title={playlist.name}
			total={playlist.tracks.total}
		/>
		<Pagination paginatedList={tracks} on:loadmore={loadMoreTracks} {isLoading} />
	{:else}
		<div class="empty-playlist">
			<p>No items added to this playlist yet.</p>
			<Button element="a" href="/search">Search for Content</Button>
			<Button element="a" href="/playlists">View all playlists</Button>
		</div>
	{/if}
</ItemPage>

<Modal id="edit-playlist-modal" title="Edit {playlist.name}">
	<PlaylistForm
		{playlist}
		form={form && 'editForm' in form ? form : null}
		userId={data.user?.id}
		action="/playlist/{playlist.id}/edit"
		on:success={() => {
			Micromodal.close('edit-playlist-modal');
			// invalidate(`/api/spotify/playlists/${playlist.id}`);
			invalidateAll();
		}}
	/>
</Modal>

<style lang="scss">
	.empty-playlist {
		text-align: center;
		margin-top: 40px;
		p {
			font-size: functions.toRem(22);
			font-weight: 600;
		}
		:global(a) {
			margin: 0 10px;
		}
	}
	.playlist-description {
		color: var(--light-gray);
		font-size: functions.toRem(18);
		margin-bottom: 0;
	}
	.meta {
		font-size: functions.toRem(13);
		margin-top: 10px;
		span {
			margin-right: 5px;
			&:first-child {
				font-weight: 600;
			}
		}
	}
	.playlist-actions {
		display: flex;
		justify-content: flex-end;
		margin: 10px 0 30px;
		.follow-form {
			:global(.button) {
				display: flex;
				align-items: center;
				gap: 10px;

				:global(svg) {
					width: 22px;
					height: 22px;
				}
			}
			p.error {
				text-align: right;
				color: var(--error);
				font-size: functions.toRem(14);
			}
		}
	}
</style>
