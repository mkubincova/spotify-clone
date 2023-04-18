<script lang="ts">
	import { Music } from 'lucide-svelte';

	type AlbumType = SpotifyApi.AlbumObjectFull | SpotifyApi.AlbumObjectSimplified;
	type PlaylistType = SpotifyApi.PlaylistObjectFull | SpotifyApi.PlaylistObjectSimplified;
	type ArtistType = SpotifyApi.ArtistObjectFull;

	export let item: AlbumType | PlaylistType | ArtistType;
</script>

<div class="card {item.type}">
	{#if item.images.length > 0}
		<img src={item.images[0].url} alt="{item.type} cover for {item.name}" loading="lazy" />
	{:else}
		<div class="cover-placeholder">
			<Music aria-hidden="true" focusable="false" color="var(--light-gray)" />
		</div>
	{/if}
	<h4 class="truncate-1"><a href="/{item.type}/{item.id}" title={item.name}>{item.name}</a></h4>
	{#if item.type === 'album'}
		<p class="truncate-1">{item.artists.map((artist) => artist.name).join(', ')}</p>
	{:else if item.type === 'playlist'}
		<p class="truncate-2">{item.description}</p>
	{/if}
</div>

<style lang="scss">
	.card {
		background-color: var(--dark-gray);
		padding: 10px;
		box-sizing: 0 0 40px rgba(0, 0, 0, 0.4);
		border-radius: 4px;
		position: relative;
		transition: background-color 0.3s;
		&:hover {
			background-color: var(--medium-gray);
			.cover-placeholder {
				background-color: var(--dark-gray);
			}
		}
		h4 {
			margin: 0 0 10px;
			font-size: functions.toRem(16);
			font-weight: 600;
			line-height: 1;
			a {
				text-decoration: none;
				color: var(--text-color);
				&:focus-visible {
					outline: none;
					&::after {
						outline: 2px solid var(--accent-color);
					}
				}
				&::after {
					content: '';
					position: absolute;
					inset: 0;
					border-radius: 4px;
				}
			}
		}
		p {
			position: relative;
			margin: 0;
			color: var(--light-gray);
			font-size: functions.toRem(14);
		}
		img {
			width: 100%;
			aspect-ratio: 1;
			object-fit: cover;
			margin-bottom: 20px;
		}
		.cover-placeholder {
			width: 100%;
			aspect-ratio: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: var(--medium-gray);
			margin-bottom: 20px;
			transition: background-color 0.3s;
			:global(svg) {
				width: 40%;
				height: 40%;
			}
		}
	}
</style>
