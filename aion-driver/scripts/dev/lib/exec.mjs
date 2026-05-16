import { spawnSync } from "node:child_process";

/**
 * @param {string} command
 * @param {string[]} [args]
 * @param {{ cwd?: string; stdio?: 'inherit' | 'pipe'; env?: NodeJS.ProcessEnv; shell?: boolean }} [opts]
 */
export function run(command, args = [], opts = {}) {
  const { cwd, stdio = "pipe", env, shell } = opts;
  const isWin = process.platform === "win32";
  const useShell = shell === true || (shell === undefined && isWin && command === "cmd.exe");
  const r = spawnSync(command, args, {
    cwd,
    stdio,
    encoding: "utf8",
    env: { ...process.env, ...env },
    shell: useShell,
  });
  return {
    status: r.status ?? 1,
    stdout: (r.stdout ?? "").toString(),
    stderr: (r.stderr ?? "").toString(),
  };
}

/** npm-скрипты: на Windows надёжнее через shell. */
export function npmScript(scriptName, inherit = true) {
  const isWin = process.platform === "win32";
  if (isWin) {
    return run("cmd.exe", ["/d", "/s", "/c", `npm run ${scriptName}`], {
      stdio: inherit ? "inherit" : "pipe",
      shell: false,
    });
  }
  return run("npm", ["run", scriptName], { stdio: inherit ? "inherit" : "pipe", shell: false });
}

export function git(args, inherit = false) {
  return run("git", args, { stdio: inherit ? "inherit" : "pipe", shell: false });
}
