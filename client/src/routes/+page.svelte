<script lang="ts">
   import "./page.css";
   import WebRTCPlayer from "$lib/components/WebRTCPlayer.svelte";
   import AudioMeter from "$lib/components/AudioMeter.svelte";
   import "$lib/components/av-overlay.css";

   let stream: MediaStream | null = null;

   // Type the component instance you bind to
   type WebRTCPlayerHandle = {
      toggleMute(): void;
      isMuted(): boolean;
   };

   let player: WebRTCPlayerHandle | null = null;
   let muted = true;
   let mutedIcon = "";
   let muteAria = "";
   let muteTitle = "";

   function onStream(s: MediaStream | null) {
      stream = s;
   }

   function onMuteClick(e: MouseEvent) {
      e.stopPropagation();
      player?.toggleMute();
   }

   $: {
      muted = player?.isMuted() ?? true;
      mutedIcon = muted ? "🔇" : "🔊";
      muteAria = muted ? "Unmute" : "Mute";
      muteTitle = muted ? "Unmute (m)" : "Mute (m)";
   }
</script>

<svelte:head>
   <title>🐔 Cluckingham Guard 🐔</title>
</svelte:head>

<main>
   <div class="header">
      <h1 class="title">🐔 Cluckingham Guard 🐔</h1>
   </div>

   <WebRTCPlayer bind:this={player} whepUrl="http://localhost:8889/cam/whep" {onStream} maxWidth={960} aspect="16/9" on:mutechange={(e) => (muted = e.detail.muted)}>
      <div slot="overlay" class="av-pill">
         <button type="button" class="mute-btn" aria-label={muteAria} aria-pressed={muted} title={muteTitle} on:click={onMuteClick}>{mutedIcon}</button>
         <AudioMeter {stream} />
      </div>
   </WebRTCPlayer>
</main>
