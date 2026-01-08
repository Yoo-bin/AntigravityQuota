#!/usr/bin/env bun

import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { loadAccounts } from "./config";
import { refreshAccessToken } from "./auth";
import { fetchQuota, fetchQuotaRaw } from "./api";
import type { AccountQuota, FetchAvailableModelsResponse, ProcessedQuota } from "./types";

interface RawAccountQuota {
  email: string;
  rawResponse?: FetchAvailableModelsResponse;
  error?: string;
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

program.parse();
