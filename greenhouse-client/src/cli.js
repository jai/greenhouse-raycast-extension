import { HarvestClient } from "./harvest-client.js";

function parseArgs(argv) {
  const args = { method: "GET", path: null, params: null, body: null, paginate: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--method") {
      args.method = argv[i + 1];
      i += 1;
    } else if (arg === "--path") {
      args.path = argv[i + 1];
      i += 1;
    } else if (arg === "--params") {
      args.params = argv[i + 1];
      i += 1;
    } else if (arg === "--body") {
      args.body = argv[i + 1];
      i += 1;
    } else if (arg === "--paginate") {
      args.paginate = true;
    } else if (arg === "--on-behalf-of") {
      args.onBehalfOf = argv[i + 1];
      i += 1;
    } else if (arg === "--pretty") {
      args.pretty = true;
    }
  }
  return args;
}

function parseParams(paramString) {
  if (!paramString) {
    return null;
  }
  const params = {};
  const searchParams = new URLSearchParams(paramString);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

function parseBody(bodyString) {
  if (!bodyString) {
    return null;
  }
  try {
    return JSON.parse(bodyString);
  } catch {
    return bodyString;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.path) {
    console.error("Usage: node src/cli.js --method GET --path /jobs [--params \"status=open\"] [--paginate]");
    process.exit(1);
  }

  const client = new HarvestClient({
    apiKey: process.env.GREENHOUSE_HARVEST_API_KEY,
    onBehalfOf: args.onBehalfOf || process.env.GREENHOUSE_ON_BEHALF_OF,
  });

  const params = parseParams(args.params);
  const body = parseBody(args.body);

  const output = args.paginate
    ? await client.listAll(args.path, params)
    : (await client.request({ method: args.method, path: args.path, params, body })).data;

  if (args.pretty) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(JSON.stringify(output));
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.data) {
    console.error(JSON.stringify(error.data, null, 2));
  }
  process.exit(1);
});
