import { List } from "@raycast/api";
import type { HarvestJob } from "./types";

interface JobPipelineProps {
  job: HarvestJob;
}

export default function JobPipeline({ job }: JobPipelineProps) {
  return (
    <List searchBarPlaceholder={`Search ${job.name} pipeline`}>
      <List.EmptyView
        title={`${job.name} pipeline`}
        description="Pipeline view will be added next."
      />
    </List>
  );
}
