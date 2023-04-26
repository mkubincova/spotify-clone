<script lang="ts">
	import { Card, Button, Pagination } from '$components';
	import type { PageData } from './$types';
	import { toasts } from '$stores';
	import Modal from '$components/Modal.svelte';
	import Micromodal from 'micromodal';
	import PlaylistForm from '$components/PlaylistForm.svelte';
	import type { ActionData } from './new/$types';

	export let data: PageData;
	export let form: ActionData;

	let isLoading = false;

	$: playlists = data.userPlaylists;

	const loadMoreItems = async () => {
		if (!playlists.next) return;
		isLoading = true;
		const res = await fetch(playlists.next.replace('https://api.spotify.com/v1/', '/api/spotify/'));
		const resJSON = await res.json();
		if (res.ok) {
			playlists = { ...resJSON, items: [...playlists.items, ...resJSON.items] };
		} else {
			toasts.error(resJSON.error.message || 'Could not load data');
		}
		isLoading = false;
	};
</script>

<div class="content">
	{#if playlists.items.length > 0}
		<div class="title">
			<h1>{data.title}</h1>
			<Button
				element="a"
				href="/playlists/new"
				on:click={(e) => {
					e.preventDefault();
					Micromodal.show('add-playlist-modal');
				}}>+ Add New</Button
			>
		</div>
		<div class="grid-items">
			{#each playlists.items as item}
				<Card {item} />
			{/each}
		</div>
		<Pagination paginatedList={playlists} on:loadmore={loadMoreItems} {isLoading} />
	{:else}
		<div class="empty">
			<p>No playlists yet!</p>
			<Button element="a" href="/playlists/new">+ Add New</Button>
		</div>
	{/if}
</div>

<Modal id="add-playlist-modal" title="Add a new playlist">
	<PlaylistForm {form} userId={data.user?.id} action="/playlists/new" />
</Modal>

<style lang="scss">
	.content {
		padding-bottom: 60px;
		.title {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
		.grid-items {
			margin-bottom: 40px;
		}
		.empty {
			text-align: center;
			margin-top: 40px;
			p {
				font-size: functions.toRem(22);
				font-weight: 600;
			}
		}
	}
</style>
