<script lang="ts">
	import Card from '$components/Card.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: albums = data.searchResults.albums?.items;
	$: artists = data.searchResults.artists?.items;
	$: playlists = data.searchResults.playlists?.items;
</script>

<h1>{data.title}</h1>

{#if (!albums || albums.length === 0) && (!playlists || playlists.length === 0) && (!artists || artists.length === 0)}
	<p>No results found!</p>
{/if}

{#if albums && albums.length > 0}
	<div class="section">
		<h2>Albums</h2>
		<div class="grid-items">
			{#each albums as album}
				<div class="grid-item">
					<Card item={album} />
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if playlists && playlists.length > 0}
	<div class="section">
		<h2>Playlists</h2>
		<div class="grid-items">
			{#each playlists as playlist}
				<div class="grid-item">
					<Card item={playlist} />
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if artists && artists.length > 0}
	<div class="section">
		<h2>Artists</h2>
		<div class="grid-items">
			{#each artists as artist}
				<div class="grid-item">
					<Card item={artist} />
				</div>
			{/each}
		</div>
	</div>
{/if}

<style lang="scss">
	h1 {
		font-size: functions.toRem(28);
	}
	h2 {
		font-size: functions.toRem(22);
	}
	.section {
		margin-bottom: 40px;
	}
</style>
