import { Action, ActionPanel, List } from "@raycast/api";
import JobsList from "./jobs/JobsList";

export default function Command() {
  return (
    <List>
      <List.Item
        title="Jobs"
        subtitle="Browse open roles"
        actions={
          <ActionPanel>
            <Action.Push title="Open Jobs" target={<JobsList />} />
          </ActionPanel>
        }
      />
    </List>
  );
}
