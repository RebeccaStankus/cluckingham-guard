<script lang="ts">
   // createEventDispatcher will be deprecated for svelte 5
   import { onDestroy, onMount } from "svelte";
   import type { ConnState } from "$lib/utils/connectWhep";
   import { connectWhep } from "$lib/utils/connectWhep";
   import "$lib/components/webrtc-player.css";

   export let whepUrl: string;
   export let muted: boolean = true;
   export let stream: MediaStream | null = null;

   let videoEl: HTMLVideoElement | null = null;
   let state: ConnState = "idle";
   let peerConnection: RTCPeerConnection | null = null;
   let mouseOver = false;
   let mounted = false;

   onMount(() => {
      mounted = true;
   });

   onDestroy(() => stop());

   $: if (videoEl) videoEl.muted = !!muted;

   export function toggleMute() {
      muted = !muted;
   }

   async function start() {
      if (peerConnection || state === "connecting") return;
      state = "connecting";
      peerConnection = await connectWhep({
         whepUrl,
         onState: (newState) => (state = newState),
         onStream: (newStream: MediaStream | null) => {
            stream = newStream;
            if (mounted && videoEl && !videoEl.srcObject && stream) {
               videoEl.srcObject = stream;
            }
         },
      }).catch(() => {
         state = "offline";
         peerConnection = null;
         return null;
      });
   }

   function stop() {
      try {
         peerConnection?.close();
      } catch {}
      peerConnection = null;

      const currentStream = (videoEl && (videoEl as any).srcObject) as MediaStream | null;
      if (currentStream) {
         try {
            currentStream.getTracks().forEach((track) => track.stop());
         } catch {}
      }
      if (mounted && videoEl) {
         try {
            (videoEl as any).srcObject = null;
         } catch {}
      }

      stream = null;
      state = "idle";
   }

   $: isPlaying = state === "playing";
   $: showPlay = !isPlaying;
   $: showStop = isPlaying && mouseOver;
</script>

<div class="wrap">
   <div class="frame" role="region" on:mouseenter={() => (mouseOver = true)} on:mouseleave={() => (mouseOver = false)}>
      <video class="video" bind:this={videoEl} autoplay playsinline {muted} controls={false} disablePictureInPicture controlslist="nodownload noplaybackrate noremoteplayback nofullscreen" aria-label="Chicken coop live camera">
         <track kind="captions" src="" label="live" />
      </video>

      {#if !isPlaying}
         <div class="placeholder" aria-hidden="true">
            <span>{state === "connecting" ? "Connecting…" : ""}</span>
         </div>
      {/if}

      <button class="center-btn" aria-label={showPlay ? "Start video" : "Stop video"} on:click={showPlay ? start : stop} style="opacity:{showPlay ? 1 : showStop ? 1 : 0}; pointer-events:{showPlay || showStop ? 'auto' : 'none'}">
         {#if showPlay}▶{:else}■{/if}
      </button>

      <div class="overlay-slot" style="opacity:{showPlay ? 0 : 1};">
         <slot name="overlay"></slot>
      </div>
   </div>
</div>
