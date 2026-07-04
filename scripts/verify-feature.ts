#!/usr/bin/env bun
/**
 * Feature verification runner — stability + usability tests, evidence artifact.
 * Usage: bun run scripts/verify-feature.ts [feature] [--deploy]
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const feature = process.argv[2] ?? "portfolio-agent";
const deploy = process.argv.includes("--deploy");
const evidenceDir = path.join(root, "artifacts", feature, "evidence");
const matrixPath = path.join(evidenceDir, "spec-matrix.json");

interface MatrixScenario {
  id: string;
  title: string;
  status: "pass" | "partial" | "missing";
}

interface SpecMatrix {
  feature: string;
  scenarios: MatrixScenario[];
}

function run(cmd: string, args: string[], env?: NodeJS.ProcessEnv): {
  ok: boolean;
  output: string;
  ms: number;
} {
  const start = Date.now();
  const result = spawnSync(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return {
    ok: result.status === 0,
    output: output.trim(),
    ms: Date.now() - start,
  };
}

function summarizeMatrix(matrix: SpecMatrix): string {
  const counts = { pass: 0, partial: 0, missing: 0 };
  for (const s of matrix.scenarios) {
    counts[s.status]++;
  }
  return `pass ${counts.pass} · partial ${counts.partial} · missing ${counts.missing} (total ${matrix.scenarios.length})`;
}

function main() {
  mkdirSync(evidenceDir, { recursive: true });

  if (!existsSync(matrixPath)) {
    console.error(`Missing ${matrixPath}`);
    process.exit(1);
  }

  const matrix = JSON.parse(readFileSync(matrixPath, "utf-8")) as SpecMatrix;
  const iso = new Date().toISOString();
  const steps: Array<{ name: string; ok: boolean; ms: number; tail: string }> = [];

  const vitest = run("bun", ["run", "test"]);
  steps.push({
    name: "vitest",
    ok: vitest.ok,
    ms: vitest.ms,
    tail: vitest.output.split("\n").slice(-8).join("\n"),
  });

  const build = run("bun", ["run", "build"]);
  steps.push({
    name: "build",
    ok: build.ok,
    ms: build.ms,
    tail: build.output.split("\n").slice(-12).join("\n"),
  });

  const stability = run("bun", ["run", "test:e2e:stability"]);
  steps.push({
    name: "e2e-stability",
    ok: stability.ok,
    ms: stability.ms,
    tail: stability.output.split("\n").slice(-10).join("\n"),
  });

  const usability = run("bun", ["run", "test:e2e:usability"]);
  steps.push({
    name: "e2e-usability",
    ok: usability.ok,
    ms: usability.ms,
    tail: usability.output.split("\n").slice(-10).join("\n"),
  });

  if (deploy) {
    const deployEnv: NodeJS.ProcessEnv = {};
    if (process.env.PLAYWRIGHT_BASE_URL) {
      deployEnv.PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL;
    }
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      deployEnv.VERCEL_AUTOMATION_BYPASS_SECRET =
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }
    const deployE2e = run("bun", ["run", "test:e2e:deploy"], deployEnv);
    steps.push({
      name: "e2e-deploy",
      ok: deployE2e.ok,
      ms: deployE2e.ms,
      tail: deployE2e.output.split("\n").slice(-10).join("\n"),
    });
  }

  const allOk = steps.every((s) => s.ok);
  const md = `# Verification — ${feature}

**Generated:** ${iso}  
**Overall:** ${allOk ? "PASS" : "FAIL"}  
**Deploy mode:** ${deploy ? "yes" : "no"}

## Spec matrix summary

${summarizeMatrix(matrix)}

Source: \`artifacts/${feature}/evidence/spec-matrix.json\`

## Steps

| Step | Result | Duration |
|------|--------|----------|
${steps.map((s) => `| ${s.name} | ${s.ok ? "pass" : "**fail**"} | ${(s.ms / 1000).toFixed(1)}s |`).join("\n")}

## Step details

${steps
  .map(
    (s) => `### ${s.name} (${s.ok ? "pass" : "FAIL"})

\`\`\`
${s.tail || "(no output)"}
\`\`\`
`
  )
  .join("\n")}

## Next

Run \`/verify-loop ${feature}\` for product-reviewer and improvement backlog.
`;

  const latestPath = path.join(evidenceDir, "verification-latest.md");
  const stampedPath = path.join(
    evidenceDir,
    `verification-${iso.slice(0, 19).replace(/[:T]/g, "-")}.md`
  );

  writeFileSync(latestPath, md);
  writeFileSync(stampedPath, md);

  matrix.updatedAt = iso.slice(0, 10);
  writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);

  console.log(md);
  console.log(`\nWrote ${latestPath}`);
  process.exit(allOk ? 0 : 1);
}

main();
