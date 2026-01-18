import { afterEach, describe, expect, it, vi } from "vitest";
import { HarvestClient } from "../api/harvest";
import { fetchJobPipelineData, fetchOpenJobs } from "./harvestData";
import type {
  HarvestApplication,
  HarvestCandidate,
  HarvestJob,
  HarvestJobStage,
} from "./types";

const toJsonResponse = (
  data: unknown,
  headers: Record<string, string> = {},
) => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
};

const resolveUrl = (input: RequestInfo | URL) => {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchOpenJobs", () => {
  it("fetches open jobs across pages", async () => {
    const client = new HarvestClient({ apiKey: "test-key" });
    const firstPage: HarvestJob[] = [
      { id: 101, name: "Designer", status: "open" },
    ];
    const secondPage: HarvestJob[] = [
      { id: 202, name: "Engineer", status: "open" },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url.includes("/jobs?status=open")) {
        return toJsonResponse(firstPage, {
          Link: '<https://harvest.greenhouse.io/v1/jobs?page=2>; rel="next"',
        });
      }
      if (url.includes("/jobs?page=2")) {
        return toJsonResponse(secondPage);
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const results = await fetchOpenJobs(client);

    expect(results).toEqual([...firstPage, ...secondPage]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCallUrl = resolveUrl(fetchMock.mock.calls[0]?.[0]);
    const firstParams = new URL(firstCallUrl).searchParams;
    expect(firstParams.get("status")).toBe("open");
  });
});

describe("fetchJobPipelineData", () => {
  it("fetches stages, applications, and candidates for a job", async () => {
    const client = new HarvestClient({ apiKey: "test-key" });
    const jobId = 555;
    const stages: HarvestJobStage[] = [
      {
        id: 1,
        name: "Applied",
        job_id: jobId,
        priority: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      },
    ];
    const applications: HarvestApplication[] = [
      {
        id: 11,
        candidate_id: 201,
        applied_at: "2024-01-05T00:00:00Z",
        last_activity_at: null,
        current_stage: { id: 1, name: "Applied" },
        status: "active",
        jobs: [{ id: jobId, name: "Engineer" }],
      },
      {
        id: 12,
        candidate_id: 201,
        applied_at: "2024-01-06T00:00:00Z",
        last_activity_at: null,
        current_stage: { id: 1, name: "Applied" },
        status: "active",
        jobs: [{ id: jobId, name: "Engineer" }],
      },
      {
        id: 13,
        candidate_id: 202,
        applied_at: "2024-01-07T00:00:00Z",
        last_activity_at: null,
        current_stage: { id: 1, name: "Applied" },
        status: "active",
        jobs: [{ id: jobId, name: "Engineer" }],
      },
    ];
    const candidates: HarvestCandidate[] = [
      { id: 201, first_name: "Ada", last_name: "Lovelace" },
      { id: 202, name: "Grace Hopper" },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      const parsed = new URL(url);

      if (parsed.pathname === `/v1/jobs/${jobId}/stages`) {
        return toJsonResponse(stages);
      }

      if (parsed.pathname === "/v1/applications") {
        expect(parsed.searchParams.get("job_id")).toBe(String(jobId));
        expect(parsed.searchParams.get("status")).toBe("active");
        return toJsonResponse(applications);
      }

      if (parsed.pathname === "/v1/candidates") {
        expect(parsed.searchParams.get("candidate_ids")).toBe("201,202");
        return toJsonResponse(candidates);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchJobPipelineData(client, jobId);

    expect(result.stages).toEqual(stages);
    expect(result.applications).toEqual(applications);
    expect(result.candidates).toEqual({
      201: candidates[0],
      202: candidates[1],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
