import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import type { AntigravityAccountsFile } from "./types";

const CONFIG_PATH = join(
  homedir(),
  ".config",
  "opencode",
  "antigravity-accounts.json"
);

export async function loadAccounts(): Promise<AntigravityAccountsFile> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    const data = JSON.parse(content) as AntigravityAccountsFile;

    if (!data.accounts || !Array.isArray(data.accounts)) {
      throw new Error("Invalid accounts.json format: missing accounts array");
    }

    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Config file not found: ${CONFIG_PATH}\nPlease make sure you are logged in to Antigravity.`
      );
    }
    throw error;
  }
}
