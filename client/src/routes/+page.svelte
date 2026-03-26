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
   let nestOccupied = false;

   async function pollNest() {
      try {
         const res = await fetch("http://localhost:5000/events");
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
</script>

<svelte:head>
   <title>Cluckingham - Live</title>
</svelte:head>

<section class="cam-page">
   <WebRTCPlayer bind:this={player} whepUrl="http://localhost:8889/cam/whep" bind:muted bind:stream>
      <div slot="overlay" class="av-pill">
         <button type="button" class="mute-btn" aria-label={muteAria} aria-pressed={muted} title={muteTitle} on:click={onMuteClick}>{mutedIcon}</button>
         <AudioMeter {stream} />
      </div>
   </WebRTCPlayer>
</section>

{#if stream}
   <p class="nest-status" class:occupied={nestOccupied}>
      {nestOccupied ? "A bird is on the nest!" : "No bird on the nest."}
   </p>
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
</style>
