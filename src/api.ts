import type {
  FetchAvailableModelsResponse,
  ModelType,
  ProcessedQuota,
} from "./types";

const API_ENDPOINT =
  "https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels";
const USER_AGENT = "antigravity/1.11.3 Darwin/arm64";

export async function fetchQuota(
  accessToken: string,
  projectId: string
): Promise<ProcessedQuota[]> {
  const data = await fetchQuotaRaw(accessToken, projectId);
  return processQuotaData(data);
}

export async function fetchQuotaRaw(
  accessToken: string,
  projectId: string
): Promise<FetchAvailableModelsResponse> {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ project: projectId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch quota: ${response.status} ${errorText}`);
  }

  return (await response.json()) as FetchAvailableModelsResponse;
}

function processQuotaData(data: FetchAvailableModelsResponse): ProcessedQuota[] {
  const quotaMap = new Map<ModelType, ProcessedQuota>();

  for (const [modelName, modelInfo] of Object.entries(data.models)) {
    if (!modelInfo.quotaInfo) continue;

    let modelType: ModelType | null = null;

    if (modelName.startsWith("gemini-3-pro-high")) {
      modelType = "gemini-3-pro";
    } else if (modelName.startsWith("gemini-3-flash")) {
      modelType = "gemini";
    } else if (modelName.startsWith("claude")) {
      modelType = "claude";
    }

    if (modelType && !quotaMap.has(modelType)) {
      const fraction = modelInfo.quotaInfo.remainingFraction;
      const remainingPercent = typeof fraction === "number" && !isNaN(fraction)
        ? Math.round(fraction * 1000) / 10
        : 0;

      quotaMap.set(modelType, {
        model: modelType,
        remainingPercent,
        resetTime: new Date(modelInfo.quotaInfo.resetTime),
      });
    }
  }

  return Array.from(quotaMap.values());
}
