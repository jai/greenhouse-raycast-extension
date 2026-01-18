import { Action, ActionPanel, List, getPreferenceValues } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { HarvestClient, HarvestError } from "../api/harvest";
import type {
  HarvestApplication,
  HarvestCandidate,
  HarvestJob,
  HarvestJobStage,
} from "./types";

interface JobPipelineProps {
  job: HarvestJob;
}

const CANDIDATE_BATCH_SIZE = 50;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const buildCandidateName = (candidate?: HarvestCandidate) => {
  if (!candidate) {
    return null;
  }
  const firstName = candidate.first_name?.trim();
  const lastName = candidate.last_name?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  if (fullName) {
    return fullName;
  }
  return candidate.name?.trim() || null;
};

const getDaysSince = (dateValue?: string | null) => {
  if (!dateValue) {
    return null;
  }
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }
  const diffDays = Math.floor(
    Math.max(0, Date.now() - timestamp) / MILLISECONDS_PER_DAY,
  );
  return diffDays;
};

const chunkIds = (ids: number[], size: number) => {
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

const buildCandidateMap = (candidates: HarvestCandidate[]) => {
  return candidates.reduce<Record<number, HarvestCandidate>>(
    (map, candidate) => {
      map[candidate.id] = candidate;
      return map;
    },
    {},
  );
};

export default function JobPipeline({ job }: JobPipelineProps) {
  const preferences = getPreferenceValues<{
    harvestApiKey: string;
    harvestBaseUrl?: string;
  }>();
  const client = useMemo(
    () =>
      new HarvestClient({
        apiKey: preferences.harvestApiKey,
        baseUrl: preferences.harvestBaseUrl,
      }),
    [preferences.harvestApiKey, preferences.harvestBaseUrl],
  );
  const [stages, setStages] = useState<HarvestJobStage[]>([]);
  const [applications, setApplications] = useState<HarvestApplication[]>([]);
  const [candidates, setCandidates] = useState<
    Record<number, HarvestCandidate>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPipeline = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [stageData, applicationData] = await Promise.all([
          client.listAll<HarvestJobStage>(`jobs/${job.id}/stages`),
          client.listAll<HarvestApplication>("applications", {
            job_id: job.id,
          }),
        ]);

        if (!cancelled) {
          setStages(stageData);
          setApplications(applicationData);
        }

        const candidateIds = Array.from(
          new Set(
            applicationData.map((application) => application.candidate_id),
          ),
        );
        const candidateData: HarvestCandidate[] = [];

        if (candidateIds.length) {
          const idChunks = chunkIds(candidateIds, CANDIDATE_BATCH_SIZE);
          for (const chunk of idChunks) {
            const batch = await client.listAll<HarvestCandidate>("candidates", {
              candidate_ids: chunk.join(","),
            });
            candidateData.push(...batch);
          }
        }

        if (!cancelled) {
          setCandidates(buildCandidateMap(candidateData));
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof HarvestError
              ? `Harvest API error (${err.status})`
              : "Unable to load pipeline.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPipeline();

    return () => {
      cancelled = true;
    };
  }, [client, job.id]);

  const sections = useMemo(() => {
    const grouped = new Map<string, HarvestApplication[]>();
    for (const application of applications) {
      const stageId = application.current_stage?.id ?? "none";
      const key = String(stageId);
      const currentGroup = grouped.get(key) ?? [];
      currentGroup.push(application);
      grouped.set(key, currentGroup);
    }

    const stageEntries = new Map<
      number,
      { id: number; name: string; priority: number }
    >();

    for (const stage of stages) {
      stageEntries.set(stage.id, {
        id: stage.id,
        name: stage.name,
        priority: stage.priority,
      });
    }

    for (const application of applications) {
      const currentStage = application.current_stage;
      if (!currentStage) {
        continue;
      }
      if (!stageEntries.has(currentStage.id)) {
        stageEntries.set(currentStage.id, {
          id: currentStage.id,
          name: currentStage.name,
          priority: Number.MAX_SAFE_INTEGER,
        });
      }
    }

    const orderedStages = [...stageEntries.values()].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.name.localeCompare(right.name);
    });

    const output = orderedStages
      .map((stage) => {
        const items = grouped.get(String(stage.id)) ?? [];
        return {
          id: String(stage.id),
          title: stage.name,
          applications: items,
        };
      })
      .filter((section) => section.applications.length > 0);

    const noStageApplications = grouped.get("none");
    if (noStageApplications?.length) {
      output.push({
        id: "none",
        title: "No Stage",
        applications: noStageApplications,
      });
    }

    return output;
  }, [applications, stages]);

  const hasApplications = applications.length > 0;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={`Search ${job.name} pipeline`}
    >
      {!hasApplications ? (
        <List.EmptyView
          title={error ? "Unable to load pipeline" : "No applications yet"}
          description={
            error ?? "There are no applications for this job right now."
          }
        />
      ) : (
        sections.map((section) => (
          <List.Section
            key={section.id}
            title={`${section.title} (${section.applications.length})`}
          >
            {section.applications.map((application) => {
              const candidate = candidates[application.candidate_id];
              const candidateName =
                buildCandidateName(candidate) ??
                `Candidate ${application.candidate_id}`;
              const daysSince = getDaysSince(
                application.last_activity_at ?? application.applied_at,
              );
              const activityLabel =
                daysSince === null ? undefined : `${daysSince}d`;
              const candidateUrl = `https://app.greenhouse.io/people/${application.candidate_id}`;

              return (
                <List.Item
                  key={application.id}
                  title={candidateName}
                  accessories={
                    activityLabel ? [{ text: activityLabel }] : undefined
                  }
                  actions={
                    <ActionPanel>
                      <Action.OpenInBrowser
                        title="Open Candidate"
                        url={candidateUrl}
                      />
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        ))
      )}
    </List>
  );
}
