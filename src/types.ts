// Antigravity accounts.json 구조
export interface AntigravityAccount {
  email: string;
  refreshToken: string;
  projectId: string;
}

export interface AntigravityAccountsFile {
  version: number;
  accounts: AntigravityAccount[];
}

// OAuth2 토큰 응답
export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

// Quota 정보
export interface QuotaInfo {
  remainingFraction: number;
  resetTime: string;
}

export interface ModelInfo {
  quotaInfo: QuotaInfo;
}

export interface FetchAvailableModelsResponse {
  models: Record<string, ModelInfo>;
}

// 처리된 Quota 정보
export type ModelType = "gemini-3-pro" | "gemini" | "claude";

export interface ProcessedQuota {
  model: ModelType;
  remainingPercent: number;
  resetTime: Date;
}

export interface AccountQuota {
  email: string;
  quotas: ProcessedQuota[];
  error?: string;
}
