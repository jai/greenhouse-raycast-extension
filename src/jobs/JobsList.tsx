import { Action, ActionPanel, List, getPreferenceValues } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { HarvestClient, HarvestError } from "../api/harvest";
import JobPipeline from "./JobPipeline";
import type { HarvestJob } from "./types";

export default function JobsList() {
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
  const [jobs, setJobs] = useState<HarvestJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await client.listAll<HarvestJob>("jobs", {
          status: "open",
        });
        if (!cancelled) {
          setJobs(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof HarvestError
              ? `Harvest API error (${err.status})`
              : "Unable to load jobs.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search jobs">
      {jobs.length === 0 ? (
        <List.EmptyView
          title={error ? "Unable to load jobs" : "No open jobs"}
          description={error ?? "No open roles found."}
        />
      ) : (
        jobs.map((job) => (
          <List.Item
            key={job.id}
            title={job.name}
            accessories={[{ tag: job.status }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Pipeline"
                  target={<JobPipeline job={job} />}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
