import {
  Action,
  ActionPanel,
  Color,
  List,
  Toast,
  getPreferenceValues,
  showToast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import { HarvestClient } from "../api/harvest";
import {
  type HarvestErrorDisplay,
  getHarvestErrorDisplay,
} from "../api/harvestErrors";
import { getCachedJobs, setCachedJobs } from "../cache/cacheUtils";
import JobPipeline from "./JobPipeline";
import { fetchOpenJobs } from "./harvestData";

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
  const [error, setError] = useState<HarvestErrorDisplay | null>(null);
  const cachedJobs = useMemo(() => getCachedJobs(), []);

  const { data, isLoading } = useCachedPromise(
    () => fetchOpenJobs(client),
    [],
    {
      initialData: cachedJobs ?? undefined,
      onData: (data) => {
        setCachedJobs(data);
        setError(null);
      },
      onError: async (err) => {
        const errorDisplay = getHarvestErrorDisplay(err, "jobs");
        setError(errorDisplay);
        if (errorDisplay.toastTitle) {
          await showToast({
            style: Toast.Style.Failure,
            title: errorDisplay.toastTitle,
            message: errorDisplay.toastMessage,
          });
        }
      },
    },
  );
  const jobs = data ?? [];
  const showLoading = isLoading && data === undefined;

  return (
    <List isLoading={showLoading} searchBarPlaceholder="Search jobs">
      {!showLoading && jobs.length === 0 ? (
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
            accessories={[
              {
                tag: {
                  value: job.confidential ? "internal" : job.status,
                  color: job.confidential ? Color.Yellow : Color.Green,
                },
              },
            ]}
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
