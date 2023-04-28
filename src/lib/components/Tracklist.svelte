<script lang="ts">
	import { msToTime } from '$helpers';
	import { Clock8, ListPlus, ListX } from 'lucide-svelte';
	import { Player } from '$components';
	import playingGif from '$assets/playing.gif';
	import { tippy } from '$actions';
	import Button from './Button.svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { toasts } from '$stores';
	import { hideAll } from 'tippy.js';
	import { invalidate } from '$app/navigation';

	let currentlyPlaying: string | null = null;
	let isPaused: boolean = false;
	let isAddingToPlaylist: string[] = [];
	let isRemovingFromPlaylist: string[] = [];

	export let tracks: SpotifyApi.TrackObjectFull[] | SpotifyApi.TrackObjectSimplified[];
	export let isOwner: boolean = false;
	export let userPLaylists: SpotifyApi.PlaylistObjectSimplified[] | undefined;
</script>

<div class="tracks">
	<div class="row header">
		<div class="number-col"><span class="number">#</span></div>
		<div class="info-col">
			<span class="track-title">Title</span>
		</div>
		<div class="duration-col">
			<Clock8 aria-hidden focusable="false" color="var(--light-gray)" />
		</div>
		<div class="actions-col" class:is-owner={isOwner} />
	</div>
	{#each tracks as track, index}
		<div class="row" class:is-current={currentlyPlaying === track.id}>
			<div class="number-col">
				{#if currentlyPlaying === track.id && !isPaused}
					<img src={playingGif} alt="" class="playing-gif" />
				{:else}
					<span class="number">{index + 1}</span>
				{/if}

				<div class="player">
					<Player
						{track}
						on:play={(e) => {
							currentlyPlaying = e.detail.track.id;
							isPaused = false;
						}}
						on:pause={(e) => {
							isPaused = e.detail.track.id === currentlyPlaying;
						}}
					/>
				</div>
			</div>
			<div class="info-col">
				<div class="track-title">
					<h4>{track.name}</h4>
					{#if track.explicit}
						<span class="explicit">Explicit</span>
					{/if}
				</div>
				<p class="artists">
					{#each track.artists as artist, artistIndex}
						<a href="/artist/{artist.id}">{artist.name}</a
						>{#if artistIndex < track.artists.length - 1}{', '}
						{/if}
					{/each}
				</p>
			</div>
			<div class="duration-col">
				<span class="duration">{msToTime(track.duration_ms)}</span>
			</div>
			<div class="actions-col" class:is-owner={isOwner}>
				{#if isOwner}
					<form
						action="/playlist/{$page.params.id}?/removeItem"
						method="POST"
						use:enhance={({ cancel }) => {
							if (isRemovingFromPlaylist.includes(track.id)) {
								cancel();
							}
							isRemovingFromPlaylist = [...isRemovingFromPlaylist, track.id];
							return ({ result }) => {
								if (result.type === 'error') {
									toasts.error(result.error.message);
								}
								if (result.type === 'redirect') {
									const url = new URL(`${$page.url.origin}${result.location}`);
									const error = url.searchParams.get('error');
									const success = url.searchParams.get('success');
									if (error) {
										toasts.error(error);
									}
									if (success) {
										toasts.success(success);
										invalidate(`/api/spotify/playlists/${$page.params.id}`);
									}
								}
								isRemovingFromPlaylist = isRemovingFromPlaylist.filter((t) => t !== track.id);
							};
						}}
					>
						<input hidden value={track.id} name="track" />
						<button
							title="Remove {track.name} from playlist"
							aria-label="Remove {track.name} from playlist"
							type="submit"
							class="remove-pl-button"
							disabled={isRemovingFromPlaylist.includes(track.id)}
						>
							<ListX aria-hidden focusable="false" />
						</button>
					</form>
				{:else}
					<button
						title="Add {track.name} to a playlist"
						aria-label="Add {track.name} to a playlist"
						class="add-pl-button"
						disabled={!userPLaylists}
						use:tippy={{
							content: document.getElementById(`${track.id}-playlists-menu`) || undefined,
							allowHTML: true,
							trigger: 'click',
							interactive: true,
							theme: 'menu',
							placement: 'bottom-end',
							onMount: () => {
								const template = document.getElementById(`${track.id}-playlists-menu`);
								if (template) {
									template.style.display = 'block';
								}
							}
						}}
					>
						<ListPlus aria-hidden focusable="false" />
					</button>
					{#if userPLaylists}
						<div class="playlists-menu" style="display-none" id="{track.id}-playlists-menu">
							<div class="playlists-menu-content">
								<form
									method="POST"
									action="/playlist?/addItem&redirect={$page.url.pathname}"
									use:enhance={({ cancel }) => {
										if (isAddingToPlaylist.includes(track.id)) {
											cancel();
										}
										isAddingToPlaylist = [...isAddingToPlaylist, track.id];
										return ({ result }) => {
											if (result.type === 'error') {
												toasts.error(result.error.message);
											}
											if (result.type === 'redirect') {
												const url = new URL(`${$page.url.origin}${result.location}`);
												const error = url.searchParams.get('error');
												const success = url.searchParams.get('success');
												if (error) {
													toasts.error(error);
												}
												if (success) {
													toasts.success(success);
													hideAll();
												}
											}
											isAddingToPlaylist = isAddingToPlaylist.filter((t) => t !== track.id);
										};
									}}
								>
									<input hidden value={track.id} name="track" />
									<div class="field">
										<select name="playlist" aria-label="Playlist">
											{#each userPLaylists as playlist}
												<option value={playlist.id}>{playlist.name}</option>
											{/each}
										</select>
									</div>
									<div class="submit-button">
										<Button
											element="button"
											type="submit"
											disabled={isAddingToPlaylist.includes(track.id)}
										>
											Add <span class="visually-hidden">{track.name} to selected playlist</span>
										</Button>
									</div>
								</form>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.tracks {
		.row {
			display: flex;
			align-items: center;
			padding: 7px 5px;
			border-radius: 4px;

			@include breakpoint.down('md') {
				:global(html.no-js) & {
					flex-direction: column;
					background-color: rgba($color: #fff, $alpha: 0.03);
					padding: 20px;
					margin-bottom: 20px;
				}
			}

			&.is-current {
				.info-col .track-title h4,
				.number-col .number {
					color: var(--accent-color);
				}
			}

			&.header {
				border-bottom: 1px solid var(--border);
				border-radius: 0;
				padding: 5px;
				margin-bottom: 15px;

				@include breakpoint.down('md') {
					:global(html.no-js) & {
						display: none;
					}
				}

				.track-title {
					color: var(--light-gray);
					font-size: functions.toRem(12);
					text-transform: uppercase;
				}
				.duration-col :global(svg) {
					width: 16px;
					height: 16px;
				}
			}
			&:not(.header) {
				&:hover {
					background-color: rgba($color: #fff, $alpha: 0.05);

					.number-col {
						.player {
							display: block;
						}
						.number {
							display: none;
							:global(html.no-js) & {
								@include breakpoint.down('md') {
									display: block;
								}
							}
						}

						.playing-gif {
							display: none;
						}
					}
				}
			}

			.number-col {
				width: 30px;
				display: flex;
				justify-content: flex-end;
				margin-right: 15px;
				.number {
					color: var(--light-gray);
					font-size: functions.toRem(14);
				}
				.playing-gif {
					width: 12px;
				}
				.player {
					display: none;
				}

				:global(html.no-js) & {
					width: 200px;
					display: flex;
					align-items: center;
					@include breakpoint.down('md') {
						width: 100%;
						margin-right: 0;
						margin-bottom: 15px;
					}

					.player {
						display: block;
						width: 100%;
						margin-left: 10px;
					}
				}
			}

			.info-col {
				flex: 1;
				:global(html.no-js) & {
					@include breakpoint.down('md') {
						width: 100%;
					}
				}
				.track-title {
					display: flex;
					align-items: center;
					h4 {
						margin: 0;
						font-size: functions.toRem(15);
						font-weight: 400;
						line-height: 1;
					}
					span.explicit {
						text-transform: uppercase;
						font-size: functions.toRem(8);
						margin-left: 10px;
						border: 1px solid;
						padding: 2px 3px;
						border-radius: 2px;
						line-height: functions.toRem(10);
						color: var(--light-gray);
					}
				}
				.artists {
					color: var(--light-gray);
					font-size: functions.toRem(13);
					margin: 7px 0 0;
					line-height: 1;
					a {
						color: inherit;
						text-decoration: none;
					}
				}
			}

			.duration-col {
				:global(html.no-js) & {
					@include breakpoint.down('md') {
						width: 100%;
						margin: 10px 0;
					}
				}
				span.duration {
					color: var(--light-gray);
					font-size: functions.toRem(14);
				}
			}

			.actions-col {
				width: 30px;
				margin-left: 15px;
				&:not(.is-owner) {
					:global(html.no-js) & {
						width: 200px;
						@include breakpoint.down('md') {
							width: 100%;
							margin-left: 0;
						}
					}
				}
				.add-pl-button {
					:global(html.no-js) & {
						display: none;
					}
				}
				.playlists-menu {
					:global(html.no-js) & {
						display: block !important;
					}
				}
				.add-pl-button,
				.remove-pl-button {
					background: none;
					border: none;
					padding: 5px;
					cursor: pointer;
					:global(svg) {
						stroke: var(--text-color);
						vertical-align: middle;
						width: 22px;
						height: 22px;
					}
					&:disabled {
						opacity: 0.5;
						cursor: not-allowed;
					}
				}

				.playlists-menu-content {
					padding: 15px;

					:global(html.no-js) & {
						padding: 0;

						form {
							display: flex;
							align-items: center;
						}
					}

					.field {
						:global(html.no-js) & {
							flex: 1;
						}
						select {
							width: 100%;
							height: 35px;
							border-radius: 4px;
						}
					}
					.submit-button {
						margin-top: 10px;
						text-align: right;
						:global(html.no-js) & {
							margin-top: 0;
							margin-left: 10px;
						}
					}
				}
			}
		}
	}
</style>
