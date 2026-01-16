#!/usr/bin/env bun

import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import tabtab from "tabtab";
import { loadAccounts } from "./config";
import { refreshAccessToken } from "./auth";
import { fetchQuota, fetchQuotaRaw } from "./api";
import type { AccountQuota, FetchAvailableModelsResponse, ProcessedQuota } from "./types";

// 자동완성 명령어 및 옵션 정의
const COMMANDS = ["quota", "completion", "help"];
const QUOTA_OPTIONS = ["--raw", "-r", "--help", "-h"];
const COMPLETION_OPTIONS = ["--install", "--uninstall", "--help", "-h"];

interface RawAccountQuota {
  email: string;
  rawResponse?: FetchAvailableModelsResponse;
  error?: string;
}

// 자동완성 요청 처리 함수
async function handleCompletion(): Promise<boolean> {
  const env = tabtab.parseEnv(process.env);
  if (!env.complete) return false;

  const { prev, words, lastPartial } = env;

  // 첫 번째 인자 (명령어) 자동완성
  if (words === 1) {
    const completions = COMMANDS.filter(cmd => 
      cmd.startsWith(lastPartial)
    );
    tabtab.log(completions);
    return true;
  }

  // 두 번째 인자 이상 (옵션) 자동완성
  const command = env.line.split(/\s+/)[1];
  
  if (command === "quota") {
    const completions = QUOTA_OPTIONS.filter(opt => 
      opt.startsWith(lastPartial) && !env.line.includes(opt)
    );
    tabtab.log(completions);
  } else if (command === "completion") {
    const completions = COMPLETION_OPTIONS.filter(opt => 
      opt.startsWith(lastPartial) && !env.line.includes(opt)
    );
    tabtab.log(completions);
  } else {
    tabtab.log([]);
  }

  return true;
}

const program = new Command();

program
  .name("ag")
  .description("CLI toolkit for checking Antigravity quota usage")
  .version("1.0.0");

program
  .command("quota")
  .description("Check quota usage for all accounts")
  .option("-r, --raw", "Output raw API JSON response")
  .action(async (options: { raw?: boolean }) => {
    try {
      const config = await loadAccounts();

      if (options.raw) {
        const rawResults: RawAccountQuota[] = [];

        for (const account of config.accounts) {
          try {
            const accessToken = await refreshAccessToken(account.refreshToken);
            const rawResponse = await fetchQuotaRaw(accessToken, account.projectId);
            rawResults.push({ email: account.email, rawResponse });
          } catch (error) {
            rawResults.push({
              email: account.email,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        console.log(JSON.stringify(rawResults, null, 2));
      } else {
        const results: AccountQuota[] = [];

        for (const account of config.accounts) {
          try {
            const accessToken = await refreshAccessToken(account.refreshToken);
            const quotas = await fetchQuota(accessToken, account.projectId);
            results.push({ email: account.email, quotas });
          } catch (error) {
            results.push({
              email: account.email,
              quotas: [],
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        displayResults(results);
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
    });

program
  .command("completion [shell]")
  .description("Generate shell completion script (bash, zsh, fish)")
  .option("--install", "Install completion to your shell config file")
  .option("--uninstall", "Uninstall completion from your shell config file")
  .action(async (shell: string | undefined, options: { install?: boolean; uninstall?: boolean }) => {
    const name = "ag";
    
    if (options.install) {
      try {
        await tabtab.install({
          name,
          completer: name,
        });
        console.log(chalk.green("Shell completion installed successfully!"));
        console.log(chalk.gray("Please restart your shell or run: source ~/.zshrc (or ~/.bashrc)"));
      } catch (error) {
        console.error(chalk.red("Failed to install completion:"), error);
        process.exit(1);
      }
    } else if (options.uninstall) {
      try {
        await tabtab.uninstall({
          name,
        });
        console.log(chalk.green("Shell completion uninstalled successfully!"));
      } catch (error) {
        console.error(chalk.red("Failed to uninstall completion:"), error);
        process.exit(1);
      }
    } else if (shell) {
      // 특정 쉘의 completion 스크립트 출력
      const validShells = ["bash", "zsh", "fish"];
      if (!validShells.includes(shell)) {
        console.error(chalk.red(`Invalid shell: ${shell}`));
        console.log(chalk.gray(`Valid options: ${validShells.join(", ")}`));
        process.exit(1);
      }
      
      try {
        const scriptPath = new URL(`../node_modules/tabtab/lib/scripts/${shell}.sh`, import.meta.url).pathname;
        const script = await Bun.file(scriptPath).text();
        // tabtab 템플릿 변수를 실제 값으로 대체
        const output = script
          .replace(/{pkgname}/g, name)
          .replace(/{completer}/g, name)
          .replace(/__name__/g, name)
          .replace(/__completer__/g, name);
        console.log(output);
      } catch (error) {
        console.error(chalk.red(`Failed to generate ${shell} completion script`));
        process.exit(1);
      }
    } else {
      // 쉘 타입별 completion 스크립트 출력 안내
      console.log(chalk.bold("Shell Completion Setup\n"));
      console.log("To enable tab completion, run one of the following:\n");
      console.log(chalk.cyan("  Automatic install (recommended):"));
      console.log(chalk.white("    ag completion --install\n"));
      console.log(chalk.cyan("  Manual setup:"));
      console.log(chalk.gray("    # For Zsh (add to ~/.zshrc):"));
      console.log(chalk.white('    source <(ag completion zsh)\n'));
      console.log(chalk.gray("    # For Bash (add to ~/.bashrc):"));
      console.log(chalk.white('    source <(ag completion bash)\n'));
      console.log(chalk.gray("    # For Fish (add to ~/.config/fish/config.fish):"));
      console.log(chalk.white('    ag completion fish | source\n'));
    }
  });

function formatResetTime(date: Date, isFullQuota: boolean = false): string {
  const now = new Date();
  let diffMs = date.getTime() - now.getTime();

  // 100% Quota인 경우 1분을 더해서 깔끔한 시간 표시
  if (isFullQuota) {
    diffMs += 60 * 1000;
  }

  // Reset 시간이 지난 경우
  if (diffMs <= 0) {
    return "expired";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  // 24시간 이상인 경우 days 단위로 표시
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const dayLabel = days === 1 ? "day" : "days";

    if (hours > 0 && minutes > 0) {
      return `in ${days} ${dayLabel} ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `in ${days} ${dayLabel} ${hours}h`;
    } else if (minutes > 0) {
      return `in ${days} ${dayLabel} ${minutes}m`;
    } else {
      return `in ${days} ${dayLabel}`;
    }
  }

  if (totalHours > 0 && minutes > 0) {
    return `in ${totalHours}h ${minutes}m`;
  } else if (totalHours > 0) {
    return `in ${totalHours}h`;
  } else {
    return `in ${minutes}m`;
  }
}

function getQuotaColor(percent: number): (text: string) => string {
  if (percent >= 50) return chalk.green;
  if (percent >= 20) return chalk.yellow;
  return chalk.red;
}

function displayResults(results: AccountQuota[]): void {
  for (const result of results) {
    console.log();
    console.log(chalk.bold.cyan(`Account: ${result.email}`));

    if (result.error) {
      console.log(chalk.red(`  Error: ${result.error}`));
      continue;
    }

    if (result.quotas.length === 0) {
      console.log(chalk.gray("  No quota information available"));
      continue;
    }

    const table = new Table({
      head: [
        chalk.white("Model"),
        chalk.white("Quota"),
        chalk.white("Reset Time"),
      ],
      style: {
        head: [],
        border: [],
      },
    });

    // gemini-3-pro, gemini, claude 순서로 정렬
    const modelOrder = ["gemini-3-pro", "gemini", "claude"];
    const sortedQuotas = result.quotas.sort((a, b) => {
      return modelOrder.indexOf(a.model) - modelOrder.indexOf(b.model);
    });

    for (const quota of sortedQuotas) {
      const colorFn = getQuotaColor(quota.remainingPercent);
      table.push([
        quota.model,
        colorFn(`${quota.remainingPercent.toFixed(1)}%`),
        formatResetTime(quota.resetTime, quota.remainingPercent === 100),
      ]);
    }

    console.log(table.toString());
  }
  console.log();
}

// 자동완성 요청인 경우 먼저 처리하고 종료
handleCompletion().then((handled) => {
  if (!handled) {
    program.parse();
  }
});
