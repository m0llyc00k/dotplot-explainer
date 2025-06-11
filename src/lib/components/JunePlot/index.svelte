<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  // --- Reactive State ---
  let dots = $state([]);
  let historicalLinePath = $state("");
  let todayLine = $state({});
  let timeAxisTicks = $state([]); // NEW: Reactive state for historical axis ticks

  // --- Constants & Configuration ---
  const projectionsUrl =
    "https://asset.wsj.net/wsjnewsgraphics/projects/archibald/11ck4pRC0FPKXS9gnqYDnxYZkKj2Fd_qQRiaiP9iP6Kk-dev.json";
  const historicalUrl =
    "https://asset.wsj.net/wsjnewsgraphics/projects/archibald/12UdSVr_vMCuJ2wj0SdRQKiYt0kEI20VrhRKUoIiQux0-dev.json";

  const dotRadius = 4;
  const spacing = dotRadius * 2.5;
  const bracketSize = 0.25;
  const margin = { top: 30, right: 40, bottom: 40, left: 20 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const historyWidth = width * 0.4;
  const projectionsXStart = historyWidth;

  // --- D3 Scales ---
  const xTime = d3.scaleTime().range([0, historyWidth]);
  const xBand = d3
    .scaleBand()
    .domain(["2025", "2026", "2027", "Longer run"])
    .range([projectionsXStart, width])
    .padding(0.2);
  const y = d3.scaleLinear().domain([-0.25, 6.25]).range([height, 0]);

  // --- Lifecycle Hook ---
  onMount(async () => {
    const [projectionsResponse, historicalResponse] = await Promise.all([
      fetch(projectionsUrl),
      fetch(historicalUrl),
    ]);
    const projectionsData = await projectionsResponse.json();
    const historicalDataRaw = await historicalResponse.json();

    // --- Process Historical Data ---
    const historicalData = processHistoricalData(historicalDataRaw);
    xTime.domain(d3.extent(historicalData, (d) => d.date));

    // FIX: Calculate ticks after domain is set and assign to reactive state
    timeAxisTicks = xTime.ticks(5);

    const lineGenerator = d3
      .line()
      .x((d) => xTime(d.date))
      .y((d) => y(d.rate));
    historicalLinePath = lineGenerator(historicalData);

    todayLine = { x: projectionsXStart, y1: 0, y2: height };

    // --- Process Projections Data ---
    const plotData = formatDataForPlot(projectionsData);
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
          dot.cx = xBand(dot.year) + xBand.bandwidth() / 2 + pattern[i].dx;
          dot.cy = y(dot.bracketMidpoint) + pattern[i].dy;
        });
      });
    });
    dots = expandedData;
  });

  // --- Helper Functions ---
  function processHistoricalData(data) {
    const dateParser = d3.timeParse("%Y-%m-%d");
    return data
      .map((d) => ({
        date: dateParser(d.Date),
        rate: Number(d["Federal-funds Rate (Upper Bound)"]),
      }))
      .filter((d) => d.date && !isNaN(d.rate));
  }

  function formatDataForPlot(sourceData) {
    if (!Array.isArray(sourceData)) {
      return [];
    }
    const plotData = [];
    const yearKeys = ["2025", "2026", "2027", "Longer Term"];
    for (const row of sourceData) {
      const rate = row.Target;
      for (const yearKey of yearKeys) {
        if (row.hasOwnProperty(yearKey)) {
          const count = Number(row[yearKey]);
          if (count > 0) {
            const finalYear =
              yearKey === "Longer Term" ? "Longer run" : yearKey;
            plotData.push({ year: finalYear, rate: rate, count: count });
          }
        }
      }
    }
    return plotData;
  }

  function getPattern(count) {
    const pattern = [];
    const startX = -((count - 1) / 2) * spacing;
    for (let i = 0; i < count; i++) {
      pattern.push({ dx: startX + i * spacing, dy: 0 });
    }
    return pattern;
  }

  const yTickValues = d3.range(0, 6.1, 0.5);
  const dottedTickValues = d3.range(0.25, 6, 0.5);
</script>

<div id="dot-plot-container">
  <svg
    viewBox="0 0 {width + margin.left + margin.right} {height +
      margin.top +
      margin.bottom}"
    style="width: 100%; height: auto;"
  >
    <g transform="translate({margin.left}, {margin.top})">
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

      <g class="x-axis">
        {#each xBand.domain() as tick}
          <g
            class="x-tick-group"
            transform="translate({xBand(tick) +
              xBand.bandwidth() / 2}, {height})"
          >
            <line y2="8" />
            <text y="25">{tick}</text>
          </g>
        {/each}
      </g>

      <g class="x-axis-time" transform="translate(0, {height})">
        {#each timeAxisTicks as tick}
          <g class="x-tick-group" transform="translate({xTime(tick)}, 0)">
            <line y2="8" />
            <text y="25">{d3.timeFormat("%Y")(tick)}</text>
          </g>
        {/each}
      </g>

      <g class="y-axis" transform="translate({width}, 0)">
        {#each yTickValues as tick}
          <g class="y-tick-group" transform="translate(0, {y(tick)})">
            <line x1={-5} x2={0} />
            <text x={8} dy="0.32em">{tick.toFixed(1)}</text>
          </g>
        {/each}
      </g>
      <text class="y-axis-title" x={width} y={-10} text-anchor="end"
        >Percent</text
      >

      <path class="historical-line" d={historicalLinePath} />

      <g class="dots">
        {#each dots as dot}
          <circle cx={dot.cx} cy={dot.cy} r={dotRadius} />
        {/each}
      </g>

      {#if todayLine.x}
        <g class="today-divider">
          <line
            x1={todayLine.x}
            y1={todayLine.y1}
            x2={todayLine.x}
            y2={todayLine.y2}
          />
          <text x={todayLine.x - 10} y="-8">Today</text>
        </g>
      {/if}
    </g>
  </svg>
</div>

<style>
  #dot-plot-container {
    font-family: var(--font-body, sans-serif);
    background-color: #ffffff;
    display: flex;
    justify-content: center;
    max-width: 800px;
    margin: auto;
  }
  :global(svg .y-axis-title) {
    font-size: 12px;
    font-family: var(--font-body, sans-serif);
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
  :global(svg .x-axis .x-tick-group line),
  :global(svg .x-axis-time .x-tick-group line) {
    stroke: #333;
    stroke-width: 1;
  }
  :global(svg .x-axis .x-tick-group text),
  :global(svg .x-axis-time .x-tick-group text) {
    text-anchor: middle;
    font-size: 14px;
    font-family: var(--font-body, sans-serif);
  }
  :global(svg .y-axis .y-tick-group line) {
    stroke: #333;
  }
  :global(svg .y-axis .y-tick-group text) {
    font-family: var(--font-body, sans-serif);
    font-size: 11px;
  }
  :global(svg .dots circle) {
    fill: #006be4;
    fill-opacity: 0.8;
  }

  :global(svg .historical-line) {
    fill: none;
    stroke: #333333;
    stroke-width: 2px;
  }
  :global(svg .today-divider line) {
    stroke: #888888;
    stroke-width: 1.5px;
    stroke-dasharray: 4, 4;
  }
  :global(svg .today-divider text) {
    font-size: 12px;
    text-anchor: end;
    fill: #555;
    font-family: var(--font-body, sans-serif);
    font-style: italic;
  }
</style>
