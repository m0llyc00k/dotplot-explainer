<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  // --- Reactive State ---
  let dots = $state([]);
  let dividerPositions = $state([]);
  let yearAxisGroups = $state([]);
  let containerWidth = $state(800); // Default width

  let plotData = $state([]);
  let yearKeys = $state([]);

  // --- Configuration ---
  const url =
    "https://asset.wsj.net/wsjnewsgraphics/projects/archibald/1mjYPCwTPPynRRUWj0xBEE2lD6hztYoCFzoOqmjoyn7E-dev.json";
  const dotRadius = $derived(containerWidth < 500 ? 1.5 : 2.5);
  const spacing = $derived(dotRadius * 2.5);
  const bracketSize = 0.25;

  // --- Reactive Dimensions & Margins ---
  // FIX: Adjusted margins for a left-side Y-axis
  let margin = $derived(
    containerWidth < 500
      ? { top: 30, right: 10, bottom: 60, left: 40 }
      : { top: 30, right: 20, bottom: 70, left: 50 }
  );

  let svgHeight = $derived(containerWidth < 600 ? 500 : containerWidth * 0.6);

  let width = $derived(containerWidth - margin.left - margin.right);
  let height = $derived(svgHeight - margin.top - margin.bottom);

  // --- D3 Scales (now reactive) ---
  let x = $derived(d3.scaleBand().range([0, width]).padding(0.2));
  let y = $derived(d3.scaleLinear().domain([-0.25, 6.25]).range([height, 0]));

  // --- Highlighted Rectangle (now reactive) ---
  const highlightRange = { top: 4.5, bottom: 4.25 };
  let highlightRect = $derived({
    x: 0,
    y: y(highlightRange.top),
    width: width,
    height: y(highlightRange.bottom) - y(highlightRange.top),
  });

  // --- Lifecycle Hook ---
  onMount(async () => {
    const response = await fetch(url);
    const fetchedData = await response.json();
    const processed = processChartData(fetchedData);
    plotData = processed.plotData;
    yearKeys = processed.yearKeys;
  });

  $effect(() => {
    if (yearKeys.length === 0) return;

    x.domain(yearKeys).range([0, width]);
    calculateAxisEnhancements(yearKeys);

    const expandedData = plotData.flatMap((d) =>
      Array.from({ length: d.count }, () => ({ ...d }))
    );

    expandedData.forEach((d) => {
      const lowerBound = Math.floor(d.rate / bracketSize) * bracketSize;
      d.bracketMidpoint = lowerBound + bracketSize / 2;
    });

    const groupedData = d3.group(
      expandedData,
      (d) => d.year,
      (d) => d.bracketMidpoint
    );

    groupedData.forEach((yearGroup) => {
      yearGroup.forEach((dotsInGroup) => {
        const pattern = getPattern(dotsInGroup.length);
        dotsInGroup.forEach((dot, i) => {
          dot.cx = x(dot.year) + x.bandwidth() / 2 + pattern[i].dx;
          dot.cy = y(dot.bracketMidpoint) + pattern[i].dy;
        });
      });
    });

    dots = expandedData;
  });

  // --- Helper Functions ---

  function calculateAxisEnhancements(yearKeys) {
    const dividers = [];
    for (let i = 0; i < yearKeys.length - 1; i++) {
      const pos = x(yearKeys[i]) + x.bandwidth() + (x.step() * x.padding()) / 2;
      dividers.push(pos);
    }
    dividerPositions = dividers;

    const groups = d3.group(yearKeys, (key) => key.split("_")[1] || "NA");
    const yearGroups = [];
    groups.forEach((keys, year) => {
      const firstKey = keys[0];
      const lastKey = keys[keys.length - 1];
      const startX = x(firstKey);
      const endX = x(lastKey) + x.bandwidth();
      yearGroups.push({
        year: year,
        startX: startX,
        endX: endX,
        centerX: startX + (endX - startX) / 2,
      });
    });
    yearAxisGroups = yearGroups;
  }

  function processChartData(fetchedData) {
    if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
      return { plotData: [], yearKeys: [] };
    }
    const yearKeys = [
      ...new Set(
        fetchedData.flatMap((d) => Object.keys(d).filter((k) => k !== "Target"))
      ),
    ];
    const plotData = [];
    for (const row of fetchedData) {
      const rate = row.Target;
      for (const key of yearKeys) {
        if (row.hasOwnProperty(key)) {
          const count = Number(row[key]);
          if (count > 0) {
            plotData.push({ year: key, rate: rate, count: count });
          }
        }
      }
    }
    return { plotData, yearKeys };
  }

  function getPattern(count) {
    const pattern = [];
    const dynamicSpacing = containerWidth < 500 ? dotRadius * 1.5 : spacing;
    const startX = -((count - 1) / 2) * dynamicSpacing;
    for (let i = 0; i < count; i++) {
      pattern.push({ dx: startX + i * dynamicSpacing, dy: 0 });
    }
    return pattern;
  }

  const yTickValues = d3.range(0, 6.1, 0.5);
  const dottedTickValues = d3.range(0.25, 6, 0.5);
  let xTickValues = $derived(
    containerWidth < 500 ? x.domain().filter((_, i) => i % 2 === 0) : x.domain()
  );
</script>

<div id="dot-plot-container" bind:clientWidth={containerWidth}>
  {#if width > 0 && height > 0}
    <svg
      viewBox="0 0 {containerWidth} {svgHeight}"
      style="width: 100%; height: auto;"
    >
      <g transform="translate({margin.left}, {margin.top})">
        <rect
          class="highlight-range"
          x={highlightRect.x}
          y={highlightRect.y}
          width={highlightRect.width}
          height={highlightRect.height}
        />

        <g class="grid solid">
          {#each yTickValues as tick}
            <line x1={0} x2={width} y1={y(tick)} y2={y(tick)} />
          {/each}
        </g>
        <g class="grid dotted">
          {#each dottedTickValues as tick}
            <line x1={0} x2={width} y1={y(tick)} y2={y(tick)} />
          {/each}
        </g>

        <g class="divider-lines">
          {#each dividerPositions as pos}
            <line x1={pos} x2={pos} y1={0} y2={height} />
          {/each}
        </g>

        <g class="x-axis">
          {#each xTickValues as tick}
            <g
              class="x-tick-group"
              transform="translate({x(tick) + x.bandwidth() / 2}, {height})"
            >
              <text y="25">{tick.split("_")[0]}</text>
            </g>
          {/each}
        </g>

        <g class="x-axis-years">
          {#each yearAxisGroups as group}
            <g transform="translate(0, {height})">
              <line x1={group.startX} x2={group.endX} y1="40" y2="40" />
              <text x={group.centerX} y="55">{group.year}</text>
            </g>
          {/each}
        </g>

        <g class="y-axis">
          {#each yTickValues as tick}
            <g class="y-tick-group" transform="translate(0, {y(tick)})">
              <line x1={0} x2={-5} />
              <text x={-8} dy="0.32em">{tick.toFixed(1)}</text>
            </g>
          {/each}
        </g>

        <g class="dots">
          {#each dots as dot, i (i)}
            <circle cx={dot.cx} cy={dot.cy} r={dotRadius} />
          {/each}
        </g>
      </g>
    </svg>
  {/if}
</div>

<style>
  #dot-plot-container {
    font-family: sans-serif;
    background-color: #ffffff;
    display: flex;
    justify-content: center;
    max-width: 1200px;
    width: 100%;
    margin: auto;
  }

  :global(svg .highlight-range) {
    fill: #f1c254;
    fill-opacity: 0.6;
  }

  :global(svg .y-axis-title) {
    font-size: 12px;
    font-style: italic;
  }

  :global(svg .grid line) {
    stroke: #ccc;
    stroke-opacity: 0.9;
    shape-rendering: crispEdges;
  }

  :global(svg .grid.dotted line) {
    stroke-dasharray: 2, 3;
  }

  :global(svg .grid.solid line) {
    stroke: #b0b0b0;
  }

  :global(svg .divider-lines line) {
    stroke: #e0e0e0;
    stroke-width: 1px;
    stroke-dasharray: 3, 3;
  }

  :global(svg .x-axis .x-tick-group line) {
    stroke: #333;
    stroke-width: 1;
  }

  :global(svg .x-axis .x-tick-group text) {
    text-anchor: middle;
    font-size: 12px;
    text-transform: capitalize;
  }

  :global(svg .x-axis-years line) {
    stroke: #333;
  }

  :global(svg .x-axis-years text) {
    text-anchor: middle;
    font-size: 13px;
    font-weight: bold;
  }

  :global(svg .y-axis .y-tick-group line) {
    stroke: #333;
  }

  :global(svg .y-axis .y-tick-group text) {
    font-size: 11px;
    /* FIX: Align text to the end (right edge) for a clean look */
    text-anchor: end;
  }

  :global(svg .dots circle) {
    fill: #006be4;
    fill-opacity: 0.8;
  }
</style>
