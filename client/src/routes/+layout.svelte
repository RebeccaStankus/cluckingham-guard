<script>
   import "./page.css";
</script>

<header class="top-nav">
   <div class="top-nav-container">
      <h1 class="site-title">🐔 Cluckingham Guard 🐔</h1>
      <nav class="nav-links">
         <a href="/" class="nav-link">Live Cam</a>
         <a href="/chickens" class="nav-link">Chickens</a>
         <a href="/supplies" class="nav-link">Supplies</a>
         <a href="/notifications" class="nav-link">Notifications</a>
      </nav>
   </div>
</header>

<main class="page-content">
   <slot />
</main>
