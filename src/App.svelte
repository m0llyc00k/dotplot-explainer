<script>
  import {
    Header,
    Methodology,
    WriteToSection,
    Text,
    UtilityBar,
  } from "barrons-graphics-components";

  import {
    shouldRenderBlock,
    getAuthStatus,
  } from "$lib/auth/checkSubscription";
  import AuthOverlay from "./lib/auth/AuthOverlay.svelte";

  import "./styles.css";

  let { data } = $props();

  const devUrl =
    "https://asset.wsj.net/wsjnewsgraphics/projects/archibald/1pm2HrUujipAyZemMv2kct7YE0orTruGgGqqTp-9kqRw-dev.json";

  const prodUrl =
    "";

  const hostname = window.location.hostname;
  const isDev = hostname === "localhost" || hostname.startsWith("dev.");

  let url;

  if (isDev) {
    url = devUrl;
  } else {
    url = prodUrl || devUrl;
    if (!prodUrl) {
      console.warn("[Archibald] prodUrl not provided – falling back to devUrl");
    }
  }

  let mounted = $state(false);
  let visible = $state([]);
  let isLoggedIn = $state(false);
  let isSubscriber = $state(false);

  $effect(async () => {
    try {
      const response = await fetch(url);
      data = await response.json();

      if (isDev) {
        console.log("[Archibald] Loading inset from:", url);
      }

      // =====================
      // 🔒 SUBSCRIPTION GATE
      // ===
      // ⚠️ Auth check logic – DO NOT modify without understanding subscription gating
      // This determines which content blocks are visible based on user auth status
      const checks = await Promise.all(
        (data.body || []).map((_, idx) => shouldRenderBlock(idx))
      );
      visible = checks;

      const status = await getAuthStatus();
      isLoggedIn = status.isLoggedIn;
      isSubscriber = status.isSubscriber;
      // =====================

      mounted = true;
    } catch (error) {
      console.error("Error fetching JSON or auth:", error);
      data = { body: [] };
      visible = [];
      mounted = true;
    }
  });
</script>

<div class="article-page">
  {#if mounted}
    {#each data.body || [] as comp, idx (idx)}
      <!-- 🔧 If you need to add or change how body components are rendered, do it here. -->
      <!-- This is the only place where dynamic components should be handled. -->
      {#if comp.type === "header"}
        <Header data={comp.value} />
        <UtilityBar />
      {:else if visible[idx]}
        <div class="content-block">
          {#if comp.type === "text"}
            <Text text={comp.value} />
          {:else if comp.type === "methodology"}
            <Methodology data={comp.value} />
          {:else if comp.type === "writeToSection"}
            <WriteToSection data={comp.value} />
          {/if}
        </div>
      {/if}
      <!-- ⚠️ WARNING: This overlay is critical for auth gating. Removing or changing this will break subscriber logic. -->
      <AuthOverlay showBlock={idx === 1} />
    {/each}
  {/if}
</div>
