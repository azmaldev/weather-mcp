// ============================================================
// WEATHER MCP SERVER
// Built with TypeScript + Model Context Protocol SDK
// Connects Claude (or any MCP client) to OpenWeatherMap API
// ============================================================

// --- IMPORTS ---
// McpServer: the main class that creates your MCP server
// StdioServerTransport: how the server talks to Claude (via terminal stdio)
// z (zod): validates inputs and tells Claude what each tool expects
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- CONFIG ---
// Replace with your actual OpenWeatherMap API key
// Get one free at: https://openweathermap.org/api
const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ============================================================
// PART 1 — CREATE THE SERVER
// Every MCP server starts here. Name and version are sent to
// the client (Claude) during the handshake so it knows what
// server it's talking to.
// ============================================================
const server = new McpServer({
  name: "weather-server",
  version: "1.0.0",
});

// ============================================================
// PART 2 — REGISTER TOOLS
// This is the core of your MCP server.
// Each tool has:
//   - name: what Claude calls it internally
//   - description: what Claude reads to decide WHEN to use it
//   - schema: what inputs it needs (validated by Zod)
//   - handler: the actual function that runs
// ============================================================

// --- TOOL 1: Current Weather ---
// Claude calls this when user asks "what's the weather in X"
server.tool(
  "get_weather",
  "Get the current weather for any city in the world. Returns temperature in Celsius and weather conditions.",
  {
    city: z.string().describe("City name, e.g. London, Tokyo, Mumbai"),
  },
  async ({ city }) => {
    try {
      const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      const data = await res.json() as any;

      // Handle API errors (city not found, bad key, etc.)
      if (data.cod !== 200) {
        return {
          content: [{ type: "text", text: `Error: ${data.message}` }],
          isError: true,
        };
      }

      const result = [
        `📍 ${data.name}, ${data.sys.country}`,
        `🌡️  Temperature: ${data.main.temp}°C (feels like ${data.main.feels_like}°C)`,
        `🌤️  Condition: ${data.weather[0].description}`,
        `💧 Humidity: ${data.main.humidity}%`,
        `🌬️  Wind: ${data.wind.speed} m/s`,
        `👁️  Visibility: ${(data.visibility / 1000).toFixed(1)} km`,
      ].join("\n");

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to fetch weather: ${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// --- TOOL 2: 5-Day Forecast ---
// Claude calls this when user asks "what's the weather like this week"
server.tool(
  "get_forecast",
  "Get a 5-day weather forecast for any city. Shows temperature and conditions for the next 5 days.",
  {
    city: z.string().describe("City name, e.g. London, Tokyo, Mumbai"),
  },
  async ({ city }) => {
    try {
      const url = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&cnt=5`;
      const res = await fetch(url);
      const data = await res.json() as any;

      if (data.cod !== "200") {
        return {
          content: [{ type: "text", text: `Error: ${data.message}` }],
          isError: true,
        };
      }

      const forecasts = data.list.map((item: any) => {
        const date = new Date(item.dt * 1000).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return `📅 ${date}: ${item.main.temp}°C — ${item.weather[0].description}`;
      });

      const result = `📍 5-Day Forecast for ${data.city.name}, ${data.city.country}\n\n` + forecasts.join("\n");

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to fetch forecast: ${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// --- TOOL 3: Compare Weather Between Two Cities ---
// Claude calls this when user asks "is it hotter in Dubai or London?"
server.tool(
  "compare_weather",
  "Compare current weather between two cities side by side.",
  {
    city1: z.string().describe("First city name"),
    city2: z.string().describe("Second city name"),
  },
  async ({ city1, city2 }) => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city1)}&appid=${API_KEY}&units=metric`),
        fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city2)}&appid=${API_KEY}&units=metric`),
      ]);

      const [data1, data2] = await Promise.all([
        res1.json() as Promise<any>,
        res2.json() as Promise<any>,
      ]);

      if (data1.cod !== 200) {
        return { content: [{ type: "text", text: `Error with ${city1}: ${data1.message}` }], isError: true };
      }
      if (data2.cod !== 200) {
        return { content: [{ type: "text", text: `Error with ${city2}: ${data2.message}` }], isError: true };
      }

      const hotter = data1.main.temp > data2.main.temp ? data1.name : data2.name;

      const result = [
        `📊 Weather Comparison`,
        ``,
        `📍 ${data1.name}, ${data1.sys.country}`,
        `   🌡️  ${data1.main.temp}°C — ${data1.weather[0].description}`,
        `   💧 Humidity: ${data1.main.humidity}%`,
        ``,
        `📍 ${data2.name}, ${data2.sys.country}`,
        `   🌡️  ${data2.main.temp}°C — ${data2.weather[0].description}`,
        `   💧 Humidity: ${data2.main.humidity}%`,
        ``,
        `🔥 ${hotter} is warmer right now.`,
      ].join("\n");

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Comparison failed: ${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================
// PART 3 — CONNECT AND START
// StdioServerTransport = communicate via terminal stdin/stdout
// This is what Claude Desktop uses to talk to local servers.
// server.connect() starts the server and keeps it listening.
// ============================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP server running — 3 tools ready: get_weather, get_forecast, compare_weather");
}

main().catch(console.error);