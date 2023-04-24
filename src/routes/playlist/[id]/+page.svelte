<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { ItemPage, Tracklist, Button } from '$components';
	import { page } from '$app/stores';
	import { Heart } from 'lucide-svelte';
	import { applyAction, enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

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
			alert(resJSON.error.message || 'Could not load data');
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
			<span>{followersFormat.format(playlist.followers.total)}</span>
			<span>{playlist.tracks.total} Tracks</span>
		</p>
	</div>

	<div class="playlist-actions">
		{#if data.user?.id === playlist.owner.id}
			<Button element="a" variant="outline">Edit playlist</Button>
		{:else if isFollowing !== null}
			<form
				action={`?/${isFollowing ? 'unFollowPlaylist' : 'followPlaylist'}`}
				class="follow-form"
				method="POST"
				use:enhance={() => {
					isLoadingFollow = true;
					return async ({ result }) => {
						isLoadingFollow = false;
						await applyAction(result);
						followButon.focus();
						if (result.type === 'success') {
							isFollowing = !isFollowing;
						}
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
				{#if form?.followError}
					<p class="error">{form.followError}</p>
				{/if}
			</form>
		{/if}
	</div>

	{#if playlist.tracks.items.length > 0}
		<Tracklist tracks={filteredTracks} />
		{#if tracks.next}
			<div class="load-more">
				<Button
					element="button"
					variant="outline"
					disabled={isLoading}
					aria-label="Load More Tracks"
					on:click={loadMoreTracks}>Load More</Button
				>
			</div>
		{/if}
		<div class="pagination">
			<div class="prev">
				{#if tracks.previous}
					<Button
						element="a"
						variant="outline"
						href="{$page.url.pathname}?{new URLSearchParams({
							page: `${Number(currentPage) - 1}`
						}).toString()}">← Previous page</Button
					>
				{/if}
			</div>
			<div class="next">
				{#if tracks.next}
					<Button
						element="a"
						variant="outline"
						href="{$page.url.pathname}?{new URLSearchParams({
							page: `${Number(currentPage) + 1}`
						}).toString()}">Next page →</Button
					>
				{/if}
			</div>
		</div>
	{:else}
		<div class="empty-playlist">
			<p>No items added to this playlist yet.</p>
			<Button element="a" href="/search">Search for Content</Button>
			<Button element="a" href="/playlists">View all playlists</Button>
		</div>
	{/if}
</ItemPage>

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
	.load-more {
		padding: 15px;
		text-align: center;
		:global(html.no-js) & {
			display: none;
		}
	}
	.pagination {
		display: none;
		:global(html.no-js) & {
			display: flex;
			justify-content: space-between;
			margin-top: 40px;
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