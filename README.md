# horizen-mcp

[![npm](https://img.shields.io/npm/v/@horizen/horizen-mcp)](https://www.npmjs.com/package/@horizen/horizen-mcp)

An [MCP server](https://modelcontextprotocol.io) that gives coding agents accurate, sourced facts about the Horizen chain, so they stop guessing.

When you ask an agent to deploy a contract on Horizen, configure a bridge, or integrate Stork oracle or zkVerify, it needs ground truth: the right chain ID, the right RPC URL, the right contract address. This server provides that: typed, versioned, with explicit provenance on every value. If something isn't in the registry, the agent is told so explicitly rather than making something up.

---

## Requirements

- Node.js >= 20
- A Stork API key in the `STORK_API_KEY` environment variable, only if you use the live `fetch_stork_price` tool.

---

## Quickstart

Published on npm as [`@horizen/horizen-mcp`](https://www.npmjs.com/package/@horizen/horizen-mcp).

### Claude Code

```bash
claude mcp add horizen -- npx -y @horizen/horizen-mcp
```

Or add it to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"]
    }
  }
}
```

### Claude Desktop

Edit the Claude Desktop config (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"]
    }
  }
}
```

### Cline (VS Code)

Open the Cline extension, go to the **MCP Servers** tab, choose **Edit MCP Settings**, and add:

```json
{
  "mcpServers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"]
    }
  }
}
```

### Continue (VS Code / JetBrains)

Add to `~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: horizen
    command: npx
    args: ["-y", "@horizen/horizen-mcp"]
```

### Zed

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"],
      "env": {}
    }
  }
}
```

Restart your editor after saving. The server starts on demand, with no separate process to manage.

### Stork API key (for `fetch_stork_price`)

Only the `fetch_stork_price` tool needs a key. It makes a live authenticated call to the Stork REST API, so supply a Stork API key through the `STORK_API_KEY` environment variable in your server config, alongside `command` and `args`:

```json
{
  "mcpServers": {
    "horizen": {
      "command": "npx",
      "args": ["-y", "@horizen/horizen-mcp"],
      "env": { "STORK_API_KEY": "your-stork-api-key" }
    }
  }
}
```

The key is read from the environment and is never passed as a tool argument, so it stays out of the model's context and your chat history. Every other tool works without it. If your config file is committed to git (for example a project `.mcp.json`), reference the variable rather than hardcoding the key, e.g. `"STORK_API_KEY": "${STORK_API_KEY}"`, so the secret stays out of the repo.

---

## What you can ask

Once connected, your agent has access to Horizen chain facts through natural language:

**Network info**
> "What's the Horizen mainnet chain ID and RPC URL?"
> "Give me the testnet explorer URL for Horizen."

**Contract addresses**
> "What's the Stork oracle address on Horizen?"
> "What's the PureFi verifier proxy address I should integrate against?"
> "Is Uniswap deployed on Horizen mainnet?"

**Tokens**
> "What's the cbBTC address and decimals on Horizen?"
> "List the tokens on Horizen with their decimals."

**Oracle feeds and prices**
> "What's the Stork feed ID for ETHUSD on Horizen?"
> "How do I derive a Stork feed ID for a custom asset?"
> "Fetch the live signed Stork price for ETHUSD." (needs `STORK_API_KEY`)

**Bridges**
> "How do I bridge assets to Horizen?"
> "Does Stargate support ETH on Horizen?"

**Integrations and proofs**
> "How do I integrate Stork oracle on Horizen?"
> "Can I use Den from the command line, or is it browser-only?"
> "Can I use zkVerify with Horizen? What's the contract address?"
> "Has zkVerify aggregation 42 on domain 1 been posted to Horizen?"

---

## Tools

| Tool                    | What it does                                                                                                                         |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `get_chain_info`        | Chain ID, RPC/WS URLs, explorer, gas token, settlement layer for mainnet or testnet                                                  |
| `get_contract_address`  | Verified address for a given contract + network. Returns explicit not-found on miss, never fabricates.                               |
| `list_contracts`        | All contracts in the registry with per-network deployment status                                                                     |
| `get_token_info`        | Addresses and decimals for ZEN, cbBTC, USDC.e on Horizen, plus cross-chain addresses                                                 |
| `get_stork_feed_id`     | Stork oracle feed ID for an asset (e.g. `ETHUSD`), computed via keccak256                                                            |
| `get_bridge_info`       | Bridge URLs, supported assets, and caveats: native bridge vs. Stargate                                                               |
| `get_integration_info`  | Docs paths, access method, status for Stork, Goldsky, PureFi, Den, zkVerify                                                          |
| `fetch_stork_price`     | Live authenticated pull from the Stork REST API for a signed price update. Network call; reads `STORK_API_KEY` from the environment. |
| `check_zkverify_status` | Reads the zkVerify aggregation proxy on Horizen to confirm a proof aggregation. On-chain read.                                       |

Most tools are offline lookups against the bundled registry. `fetch_stork_price` (Stork REST API) and `check_zkverify_status` (on-chain read) are the two that make live network calls.

Every registry response includes a `source` field and a `verified` date. If a value isn't in the registry, the agent gets an explicit not-found with a list of what is known, never a guess.

---

## Run from source

```bash
git clone https://github.com/HorizenOfficial/horizen-mcp
cd horizen-mcp
npm install
npm run build
node dist/index.js
```

To point your editor at a local build instead of npm:

```json
{
  "mcpServers": {
    "horizen": {
      "command": "node",
      "args": ["/path/to/horizen-mcp/dist/index.js"]
    }
  }
}
```

---

## Development

```bash
npm run dev        # watch mode, recompiles on save
npm run inspect    # MCP Inspector UI for interactive tool testing
npm test           # smoke test: builds, boots the server, and lists its tools
```

The Inspector lets you call any tool directly and inspect the full JSON response before connecting to an editor.

---

## Data

All facts live in [`data/chain-facts.json`](data/chain-facts.json). Tool handlers query this file; nothing is hardcoded in source. To update a value, edit that file and run `npm run build`.

Every entry carries a `source` (URL or attribution) and a `verified` date. Values that haven't been confirmed are left as `null` rather than guessed; the tool will tell the agent the value is unknown rather than returning something fabricated.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add contracts, integrations, or tools.

---

## License

MIT
