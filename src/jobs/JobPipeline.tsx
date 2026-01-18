import {
  Action,
  ActionPanel,
  List,
  Toast,
  getPreferenceValues,
  showToast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { HarvestClient } from "../api/harvest";
import {
  type HarvestErrorDisplay,
  getHarvestErrorDisplay,
} from "../api/harvestErrors";
import type {
  HarvestApplication,
  HarvestCandidate,
  HarvestJob,
  HarvestJobStage,
} from "./types";
import {
  buildCandidateName,
  buildPipelineSections,
  getDaysSince,
} from "./pipelineUtils";
import { fetchJobPipelineData } from "./harvestData";

interface JobPipelineProps {
  job: HarvestJob;
}

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
  const [error, setError] = useState<HarvestErrorDisplay | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPipeline = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const pipelineData = await fetchJobPipelineData(client, job.id);

        if (!cancelled) {
          setStages(pipelineData.stages);
          setApplications(pipelineData.applications);
          setCandidates(pipelineData.candidates);
        }
      } catch (err) {
        if (!cancelled) {
          const errorDisplay = getHarvestErrorDisplay(err, "pipeline");
          setError(errorDisplay);
          if (errorDisplay.toastTitle) {
            await showToast({
              style: Toast.Style.Failure,
              title: errorDisplay.toastTitle,
              message: errorDisplay.toastMessage,
            });
          }
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

  const sections = useMemo(
    () => buildPipelineSections(applications, stages),
    [applications, stages],
  );

  const hasApplications = applications.length > 0;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={`Search ${job.name} pipeline`}
    >
      {!hasApplications ? (
        <List.EmptyView
          title={error ? error.title : "No applications yet"}
          description={
            error
              ? error.description
              : "There are no applications for this job yet."
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
              const candidateUrl = `https://app.greenhouse.io/people/${application.candidate_id}?application_id=${application.id}`;

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
