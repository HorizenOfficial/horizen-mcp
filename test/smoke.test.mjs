// End-to-end smoke test: spawns the built server over stdio (exactly how an MCP
// client runs it) and checks it boots and behaves. No test framework, no extra
// dependencies: Node's built-in test runner and assert only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = join(repoRoot, "dist", "index.js");

const EXPECTED_TOOLS = [
  "get_chain_info",
  "get_contract_address",
  "list_contracts",
  "get_stork_feed_id",
  "get_bridge_info",
  "get_integration_info",
  "fetch_stork_price",
  "check_zkverify_status",
  "get_token_info",
];

// Send the given JSON-RPC requests to a fresh server process and resolve once the
// response with id `untilId` arrives (or after a timeout), then shut it down.
function callServer(requests, untilId, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverPath], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, STORK_API_KEY: "" }, // never make a live Stork call in tests
    });

    let out = "";
    let err = "";
    const finish = () => {
      clearTimeout(timer);
      child.kill();
      const messages = out
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      resolve({ messages, err });
    };

    const timer = setTimeout(finish, timeoutMs);
    child.on("error", reject);
    child.stderr.on("data", (d) => (err += d.toString()));
    child.stdout.on("data", (d) => {
      out += d.toString();
      if (out.split("\n").some((line) => {
        try {
          return JSON.parse(line).id === untilId;
        } catch {
          return false;
        }
      })) {
        finish();
      }
    });

    for (const req of requests) child.stdin.write(JSON.stringify(req) + "\n");
  });
}

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "1" } },
};
const initialized = { jsonrpc: "2.0", method: "notifications/initialized" };

test("server boots and registers every tool", async () => {
  const { messages, err } = await callServer(
    [initialize, initialized, { jsonrpc: "2.0", id: 2, method: "tools/list" }],
    2
  );

  const init = messages.find((m) => m.id === 1)?.result;
  assert.ok(init?.serverInfo?.version, `server did not report a version (stderr: ${err.slice(0, 200)})`);
  assert.match(init?.instructions ?? "", /reference data/i, "server should expose usage instructions to clients");

  const tools = messages.find((m) => m.id === 2)?.result?.tools ?? [];
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    [...EXPECTED_TOOLS].sort(),
    "the set of registered tools changed"
  );
});

test("an offline tool returns data", async () => {
  const { messages } = await callServer(
    [initialize, initialized, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_chain_info", arguments: { network: "mainnet" } } }],
    2
  );
  const text = messages.find((m) => m.id === 2)?.result?.content?.[0]?.text ?? "";
  assert.match(text, /"network":\s*"mainnet"/, "get_chain_info did not return mainnet data");
});

test("fetch_stork_price without STORK_API_KEY fails gracefully", async () => {
  const { messages } = await callServer(
    [initialize, initialized, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "fetch_stork_price", arguments: { assetId: "ETHUSD" } } }],
    2
  );
  const text = messages.find((m) => m.id === 2)?.result?.content?.[0]?.text ?? "";
  assert.match(text, /STORK_API_KEY is not set/, "expected a clean missing-key message, not a crash");
});
