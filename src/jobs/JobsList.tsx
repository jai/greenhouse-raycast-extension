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
  const [error, setError] = useState<HarvestErrorDisplay | null>(null);

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
          const errorDisplay = getHarvestErrorDisplay(err, "jobs");
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

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search jobs">
      {jobs.length === 0 ? (
        <List.EmptyView
          title={error ? error.title : "No open jobs"}
          description={
            error ? error.description : "No open roles found in Harvest."
          }
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
