# 🌤️ Weather MCP Server

Your first MCP server — connects any MCP-compatible AI (like Claude) to real-time weather data via OpenWeatherMap.

Built with TypeScript. No fluff, just the fundamentals.

---

## What is MCP?

MCP (Model Context Protocol) is an open standard that lets AI models call external tools and APIs. Instead of the AI guessing the weather, it calls **your server**, which calls the real API and returns live data.

```
Claude → calls tool → your MCP server → OpenWeatherMap API → real data back to Claude
```

---

## What This Server Does

Exposes three tools:

| Tool | Input | Output |
|------|-------|--------|
| `get_weather` | city name | temperature, humidity, wind, visibility |
| `get_forecast` | city name | 5-day forecast |
| `compare_weather` | two city names | side by side comparison |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Claude Desktop](https://claude.ai/download) installed
- Free [OpenWeatherMap API key](https://openweathermap.org/api)

---

## Project Structure

```
weather-mcp/
├── src/
│   └── index.ts        ← your server code (edit this)
├── dist/
│   └── index.js        ← compiled output (auto-generated, don't edit)
├── node_modules/       ← installed packages (auto-generated)
├── package.json        ← project dependencies
├── tsconfig.json       ← TypeScript compiler config
└── README.md
```

---

## Setup

**1. Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/weather-mcp.git
cd weather-mcp
```

**2. Install dependencies**

```bash
npm install
```

**3. Add your API key**

Open `src/index.ts` and replace line 16:

```typescript
const API_KEY = "YOUR_API_KEY_HERE";
```

with your actual OpenWeatherMap API key.

**4. Compile TypeScript**

```bash
npx tsc
```

**5. Test the server runs**

```bash
node dist/index.js
```

You should see:
```
Weather MCP server running — 3 tools ready: get_weather, get_forecast, compare_weather
```

Press `Ctrl+C` to stop.

---

## Connect to Claude Desktop

**macOS** — open this file:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows** — open this file:
```
%APPDATA%\Claude\claude_desktop_config.json
```

Paste this — replace the path with your actual project path:

**macOS/Linux:**
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather-mcp/dist/index.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\weather-mcp\\dist\\index.js"]
    }
  }
}
```

Fully quit Claude Desktop (system tray → right click → Quit) and reopen it.

---

## Try It

Open Claude Desktop and type any of these:

```
What is the weather in Tokyo?
What is the forecast for Mumbai this week?
Is it hotter in Dubai or London right now?
```

---

## tsconfig.json

Create this file in your project root:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

---

## How It Works

Every MCP server has exactly three parts:

**1. Create the server**
```typescript
const server = new McpServer({ name: "weather-server", version: "1.0.0" })
```

**2. Register tools**
```typescript
server.tool("get_weather", "description", { inputs }, async () => {
  // call your API here
  return { content: [{ type: "text", text: result }] }
})
```

**3. Connect and start**
```typescript
const transport = new StdioServerTransport()
await server.connect(transport)
```

That's it. Every MCP server you ever build follows this exact same pattern.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol — handles all communication with Claude |
| `zod` | Input validation + schema generation so Claude knows what each tool expects |
| `typescript` | Type safety, compiles to JavaScript that Node can run |

---

## Extending This Server

Want to add more tools? Copy any `server.tool()` block and change the name, description, inputs, and API call inside.

Ideas:
- `get_uv_index` — UV index for a city
- `get_air_quality` — air pollution data
- `get_sunrise_sunset` — sunrise and sunset times

---

## License

MIT — use it, modify it, build on it.