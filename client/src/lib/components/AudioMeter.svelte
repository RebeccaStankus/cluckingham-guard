<script lang="ts">
   const BYTE_CENTER = 128;
   export let gain = 4;

   import { onDestroy, onMount } from "svelte";

   export let stream: MediaStream | null = null;

   let canvas: HTMLCanvasElement;
   let mounted = false;
   let running = false;
   let audioContext: AudioContext | null = null;
   let analyzer: AnalyserNode | null = null;
   let audioByteData: Uint8Array<ArrayBuffer> | null = null;
   let frameID = 0;
   let lastLevel = 0;

   onMount(() => {
      mounted = true;
   });

   onDestroy(stop);

   // Set up a stream analyzer that updates a visual meter of volume
   function start() {
      if (!mounted || running || !stream || typeof window === "undefined") return;
      running = true;

      // * AudioContext will be suspended until a user gesture
      try {
         audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
         running = false;
         return;
      }

      const src = audioContext.createMediaStreamSource(stream);
      const context = canvas.getContext("2d");
      if (!context) {
         running = false;
         return;
      }
      analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      src.connect(analyzer);
      audioByteData = new Uint8Array(analyzer.frequencyBinCount) as unknown as Uint8Array<ArrayBuffer>;

      const updateAudioMeter = () => {
         // Constant for centering waveform values (0–255 range → centered at 128)

         if (!running || !analyzer || !audioByteData || !canvas) return;

         analyzer.getByteTimeDomainData(audioByteData);

         let sum = 0;
         for (let i = 0; i < audioByteData.length; i++) {
            const normalizedAmp = (audioByteData[i] - BYTE_CENTER) / BYTE_CENTER;
            sum += normalizedAmp * normalizedAmp;
         }

         const level = Math.min(1, Math.sqrt(sum / audioByteData.length) * gain);
         lastLevel = level;

         // Draw meter level
         const canvasWidth = canvas.width,
            canvasHeight = canvas.height;
         context.clearRect(0, 0, canvasWidth, canvasHeight);
         context.fillStyle = "#0f0";
         context.fillRect(0, 0, canvasWidth * level, canvasHeight);
         context.fillStyle = "#222";
         context.fillRect(canvasWidth * level, 0, canvasWidth * (1 - level), canvasHeight);

         frameID = requestAnimationFrame(updateAudioMeter);
      };

      frameID = requestAnimationFrame(updateAudioMeter);
   }

   function stop() {
      running = false;
      if (typeof window !== "undefined") cancelAnimationFrame(frameID);
      frameID = 0;

      try {
         analyzer?.disconnect();
      } catch (error) {
         console.warn(`Error disconnecting analyzer: ${error}`);
      }

      try {
         audioContext?.close();
      } catch (error) {
         console.warn(`Error closing audio context: ${error}`);
      }

      // clear meter
      if (canvas) {
         const context = canvas.getContext("2d");
         if (context) {
            context.fillStyle = "#000";
            context.fillRect(0, 0, canvas.width, canvas.height);
         }
      }

      analyzer = null;
      audioContext = null;
      audioByteData = null;
   }

   // resume after a user gesture
   export async function resume() {
      if (audioContext && audioContext.state !== "running") {
         try {
            await audioContext.resume();
         } catch (error) {
            console.warn(`Error resuming audio context: ${error}`);
         }
      }
   }

   // react to stream changes safely, i.e. on refresh
   $: if (mounted) {
      stop();
      if (stream) start();
   }
</script>

<canvas bind:this={canvas} id="audioMeterCanvas" aria-hidden="true"></canvas>
