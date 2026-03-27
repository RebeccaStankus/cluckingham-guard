<script lang="ts">
   import { onDestroy } from "svelte";
   import WebRTCPlayer from "$lib/components/WebRTCPlayer.svelte";
   import AudioMeter from "$lib/components/AudioMeter.svelte";

   let player: InstanceType<typeof WebRTCPlayer> | null = null;

   let stream: MediaStream | null = null;
   let muted = true;
   let mutedIcon = "";
   let muteAria = "";
   let muteTitle = "";

   function onStream(newStream: MediaStream | null) {
      stream = newStream;
   }

   $: mutedIcon = muted ? "🔇" : "🔊";
   $: muteAria = muted ? "Unmute" : "Mute";
   $: muteTitle = muted ? "Unmute (m)" : "Mute (m)";

   function onMuteClick(e: MouseEvent) {
      e.stopPropagation();
      player?.toggleMute();
   }

   // ── Nest status ────────────────────────────────────────────────────
   const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
   let nestOccupied = false;

   async function pollNest() {
      try {
         const res = await fetch(`${API_URL}/events`);
         const data = await res.json();
         if (data.length > 0) {
            nestOccupied = data[0].type === "nest_occupied";
         }
      } catch {
         // server not reachable, leave status as-is
      }
   }

   pollNest();
   const nestInterval = setInterval(pollNest, 5000);
   onDestroy(() => clearInterval(nestInterval));

   // ── Egg count ──────────────────────────────────────────────────────
   let eggCount = 0;

   async function pollEggs() {
      try {
         const res = await fetch(`${API_URL}/eggs`);
         const data = await res.json();
         eggCount = data.count;
      } catch {
         // server not reachable
      }
   }

   async function collectEggs() {
      await fetch(`${API_URL}/eggs/collect`, { method: "POST" });
      eggCount = 0;
   }

   pollEggs();
   const eggInterval = setInterval(pollEggs, 5000);
   onDestroy(() => clearInterval(eggInterval));
</script>

<svelte:head>
   <title>Cluckingham - Live</title>
</svelte:head>

<section class="cam-page">
   <WebRTCPlayer bind:this={player} whepUrl="http://localhost:8889/cam/whep" bind:muted bind:stream>
      <div slot="overlay" class="av-pill">
         <button type="button" class="mute-btn" aria-label={muteAria} aria-pressed={muted} title={muteTitle} on:click={onMuteClick}>{mutedIcon}</button>
         {#if !muted}<AudioMeter {stream} />{/if}
      </div>
   </WebRTCPlayer>
</section>

{#if stream}
   <p class="nest-status" class:occupied={nestOccupied}>
      {nestOccupied ? "A bird is on the nest!" : "No bird on the nest."}
   </p>
   <div class="egg-count">
      <span>{eggCount} {eggCount === 1 ? "egg" : "eggs"} in the nest box</span>
      {#if eggCount > 0}
         <button type="button" on:click={collectEggs}>Collected</button>
      {/if}
   </div>
{/if}

<style>
   .nest-status {
      text-align: center;
      font-size: 1.2rem;
      margin-top: 1rem;
      color: #8de1ec;
      opacity: 0.5;
   }
   .nest-status.occupied {
      opacity: 1;
      font-weight: bold;
   }
   .egg-count {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 0.5rem;
      color: #8de1ec;
      font-size: 1rem;
   }
   .egg-count button {
      background: none;
      border: 1px solid #8de1ec;
      color: #8de1ec;
      padding: 0.2rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
   }
   .egg-count button:hover {
      background: #8de1ec;
      color: rgb(15, 4, 0);
   }
</style>
