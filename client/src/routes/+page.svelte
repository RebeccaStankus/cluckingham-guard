<script lang="ts">
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
