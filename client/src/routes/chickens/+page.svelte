<!-- client/src/routes/chickens/+page.svelte -->
<script lang="ts">
   import "./chickens.css";
   import type { Chicken } from "$lib/types/chicken";
   import { onMount } from "svelte";
   import { formatAge } from "$lib/utils/age";

   export let chickens: Chicken[] = [];

   const BREEDS = ["Rhode Island Red", "Light Brahma", "Black Australorp", "Barred Plymouth Rock"] as const;

   const DEFAULT_CHICKEN: Omit<Chicken, "id" | "_id"> = {
      name: "",
      breed: "Rhode Island Red",
      imageUrl: "",
      eggSongUrl: "",
      dateOfHatch: "",
      description: "",
   };

   let currentChickenData: Partial<Chicken> = { ...DEFAULT_CHICKEN };
   let openOverlay = false;
   let saving = false;
   let error = "";
   let isNew = true;

   const open = (c?: Partial<Chicken>) => {
      currentChickenData = { ...DEFAULT_CHICKEN, ...(c ?? {}) };
      openOverlay = true;
   };

   const close = () => {
      openOverlay = false;
      currentChickenData = {};
   };

   const onKey = (e: { key: string }) => {
      if (e.key === "Escape") close();
   };

   async function loadChickens() {
      const res = await fetch("/api/chickens");
      chickens = await res.json();
      console.log("chickens:", chickens);
   }

   onMount(loadChickens);

   async function saveChicken() {
      saving = true;
      error = "";

      try {
         const id = (currentChickenData as any)._id;
         const url = id ? `/api/chickens/${id}` : `/api/chickens`;
         const method = id ? "PUT" : "POST";

         const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentChickenData),
         });

         if (!res.ok) {
            const msg = await res.json().catch(() => ({}));
            throw new Error(msg.error || `Failed to ${id ? "update" : "create"} chicken.`);
         }

         await loadChickens();
         close();
         currentChickenData = { ...DEFAULT_CHICKEN };
      } catch (e: any) {
         error = e.message || "Save failed";
      } finally {
         saving = false;
      }
   }
</script>

<svelte:head>
   <title>Cluckingham Guard — Chickens</title>
</svelte:head>

<section class="chickens-page">
   {#if openOverlay}
      {(isNew = currentChickenData._id ? false : true)}
      <div class="backdrop" on:click|self={close} on:keydown={onKey} tabindex="-1" aria-hidden={false}>
         <div class="modal" role="dialog" aria-modal="true" aria-label="Demo overlay">
            <h2>
               {#if isNew}New chicken!{:else}Update Chicken{/if}
            </h2>
            <form class="form" on:submit|preventDefault={saveChicken}>
               <label class="field">
                  <span class="label">Name *</span>
                  <input class="input" bind:value={currentChickenData.name} required />
               </label>

               <label class="field">
                  <span class="label">Date of Hatch</span>
                  <input class="input" type="date" bind:value={currentChickenData.dateOfHatch} />
               </label>

               <label class="field">
                  <span class="label">Breed *</span>
                  <select class="input" bind:value={currentChickenData.breed}>
                     {#each BREEDS as b}<option value={b}>{b}</option>{/each}
                  </select>
               </label>

               <label class="field">
                  <span class="label">Egg Song URL</span>
                  <input class="input" type="url" bind:value={currentChickenData.eggSongUrl} placeholder="https://…" />
               </label>

               <label class="field">
                  <span class="label">Image URL</span>
                  <input class="input" type="url" bind:value={currentChickenData.imageUrl} placeholder="https://…" />
               </label>

               <label class="field">
                  <span class="label">Description</span>
                  <input class="input" type="textfield" bind:value={currentChickenData.description} placeholder="Mother cluckin, egg layin, dirt scratchin..." />
               </label>

               {#if error}<p class="error">{error}</p>{/if}

               <button class="btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Add Chicken"}
               </button>
            </form>
            <button on:click={close}>Close</button>
         </div>
      </div>
   {/if}

   <div class="list">
      {#each chickens as c}
         <div class="card" on:click={() => open(c)}>
            <div class="card__header">
               <div class="card__name">{c.name}</div>
               {#if c.dateOfHatch}<div class="card__age">{formatAge(c.dateOfHatch)}</div>{/if}
            </div>
            <div class="card__meta">{c.breed}{c.dateOfHatch ? ` • ${c.dateOfHatch}` : ""}</div>
            {#if c.imageUrl}<img class="card__img" src={c.imageUrl} alt={`Photo of ${c.name}`} />{/if}
            {#if c.lastSeenAt}Last seen {c.lastSeenAt} ago.{/if}
            {#if c.description}{c.description}{/if}
         </div>
      {/each}
      {#if chickens.length === 0}<p>No chickens yet.</p>{/if}
   </div>

   <button on:click={() => open()} class="add-chicken-button">+</button>
</section>
