// scripts/roo-state.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const STATUS_MD = path.resolve(".roo/status.md");
const STATE_JSON = path.resolve(".roo/state.json");
const SCHEMA_JSON = path.resolve(".roo/schema/roo.status.v2.schema.json");

function die(msg) {
    console.error(`roo-state: ${msg}`);
    process.exit(1);
}

function extractFrontMatter(md) {
    // Strict: YAML front-matter must be the first block: --- ... ---
    const m = md.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) die("Missing or malformed YAML front-matter in .roo/status.md");
    return m[1];
}

function stableSort(value) {
    if (Array.isArray(value)) return value.map(stableSort);
    if (value && typeof value === "object") {
        const out = {};
        for (const k of Object.keys(value).sort()) out[k] = stableSort(value[k]);
        return out;
    }
    return value;
}

function sha256(buf) {
    return crypto.createHash("sha256").update(buf).digest("hex");
}

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");

if (!fs.existsSync(STATUS_MD)) die("Missing .roo/status.md");
if (!fs.existsSync(SCHEMA_JSON)) die("Missing schema at .roo/schema/roo.status.v2.schema.json");

const md = fs.readFileSync(STATUS_MD, "utf8");
const fmYaml = extractFrontMatter(md);

let state;
try {
    state = yaml.load(fmYaml);
} catch (e) {
    die(`YAML parse error in front-matter: ${e.message}`);
}

if (!state || typeof state !== "object") die("Front-matter must be a YAML object");

const schema = JSON.parse(fs.readFileSync(SCHEMA_JSON, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const ok = validate(state);
if (!ok) {
    console.error("roo-state: schema validation failed:");
    for (const err of validate.errors ?? []) {
        console.error(`- ${err.instancePath || "/"} ${err.message}`);
    }
    process.exit(2);
}

// Deterministic output to avoid noisy diffs
const canonical = stableSort(state);
const output = JSON.stringify(canonical, null, 2) + "\n";

if (checkOnly) {
    if (!fs.existsSync(STATE_JSON)) die("Missing .roo/state.json (run generator)");
    const existing = fs.readFileSync(STATE_JSON, "utf8");
    if (sha256(existing) !== sha256(output)) {
        die(".roo/state.json is out of date. Run: npm run roo:gen");
    }
    console.log("roo-state: OK (schema valid, mirror up to date)");
    process.exit(0);
}

fs.mkdirSync(path.dirname(STATE_JSON), { recursive: true });
fs.writeFileSync(STATE_JSON, output, "utf8");
console.log("roo-state: wrote .roo/state.json");
