<!-- Generated and maintained by Ralph -->

# Implementation Plan

**Priority ordered list of tasks to complete UX polish and caching features.**

**Last Updated:** 2026-01-18 (US-014 completed)

---

## ✅ COMPLETED TASKS

- **US-001 through US-012**: All passing ✓ (MVP functionality complete)
- **US-015**: Base URL normalization - VERIFIED at src/api/harvest.ts:47-48 ✓
  - Trims whitespace: `baseUrl?.trim()`
  - Falls back to default: `resolvedBaseUrl || DEFAULT_BASE_URL`
  - Removes trailing slashes: `.replace(/\/$/, "")`
- **US-013**: Empty-state flash suppressed while loading - VERIFIED at src/jobs/JobsList.tsx:75 and src/jobs/JobPipeline.tsx:108 ✓
- **US-018**: Stage counts - VERIFIED at src/jobs/JobPipeline.tsx:121 ✓
  - Format: `title={`${section.title} (${section.applications.length})`}`
  - Example output: "Applied (5)", "Rejected (3)"
- **US-017**: Direct launch into jobs list - VERIFIED at src/index.tsx:1-3 ✓
- **US-014**: Restore global fetch after tests - VERIFIED at src/jobs/harvestData.test.ts:35 ✓
  - Uses `vi.stubGlobal("fetch", ...)` and `vi.unstubAllGlobals()` cleanup

---

## 🔴 HIGH PRIORITY - UX Polish (Quick Wins)
All quick-win UX tasks are complete.

---

## 🟡 MEDIUM PRIORITY - Infrastructure Cleanup

### US-016: Remove unused raycast.json manifest
**Status:** NOT IMPLEMENTED ❌
**Risk:** Low - but creates maintenance confusion
**Effort:** 5 minutes

**Analysis Findings:**
- ✅ **package.json is authoritative** - contains version, scripts, dependencies, all 3 preferences
- ❌ **raycast.json is stale** - missing `recruitingBaseUrl` preference (added in US-011)
- ⚠️ **Icon path inconsistency** - raycast.json: `"command-icon.png"` vs package.json: `"assets/command-icon.png"`
- 📦 **Modern Raycast standard** - uses package.json as single manifest (like npm)

**Evidence package.json is authoritative:**
1. Contains `recruitingBaseUrl` preference (US-011) - raycast.json missing this
2. Has version, license, private, scripts - raycast.json lacks these
3. Build system (`npm run build`, `ray build`) reads package.json
4. Recent git history shows package.json being updated, raycast.json untouched

**Recommended Action:**
1. Verify `npm run build` works (should succeed - package.json is used)
2. Delete `/Users/jai/Developer/temp/greenhouse-raycast-extension/raycast.json`
3. Commit: "chore: US-016 - Remove legacy raycast.json manifest (package.json is authoritative)"

**Acceptance Criteria:**
- ✓ raycast.json removed from repository
- ✓ `npm run build` succeeds
- ✓ Extension builds correctly with only package.json
- ✓ All preferences (including recruitingBaseUrl) available in Raycast

---

## 🔵 LARGE FEATURES - Caching Implementation (specs/caching.md)

**Total Effort:** ~2-3 hours
**Impact:** High - instant load times, better UX

### US-019: Add @raycast/utils dependency
**Status:** NOT IMPLEMENTED ❌
**Effort:** 2 minutes

**Current State:**
- package.json:51 only has `"@raycast/api": "^1.104.1"`
- `useCachedPromise` not available

**Changes Required:**
```json
// package.json:51-52 - ADD:
"dependencies": {
  "@raycast/api": "^1.104.1",
  "@raycast/utils": "^1.20.0"
}
```

**Commands:**
```bash
npm install --save @raycast/utils
```

**Acceptance Criteria:**
- ✓ `@raycast/utils` in package.json dependencies
- ✓ `@raycast/utils` installed in node_modules
- ✓ `npm run build` succeeds

---

### US-020: Implement cache utilities module
**Status:** NOT IMPLEMENTED ❌
**Effort:** 30 minutes

**Create:** `src/cache/cacheUtils.ts` (new file)

**Cache Structure:**
```
jobs:open → JSON.stringify(HarvestJob[])
jobs:open:updatedAt → ISO timestamp
pipeline:{jobId} → JSON.stringify(JobPipelineData)
pipeline:{jobId}:updatedAt → ISO timestamp
```

**Implementation:**
```typescript
import { Cache } from "@raycast/api";
import type { HarvestJob } from "../jobs/types";
import type { JobPipelineData } from "../jobs/harvestData";

const cache = new Cache();

export const CACHE_KEY_JOBS_OPEN = "jobs:open";
export const CACHE_KEY_PIPELINE_PREFIX = "pipeline:";

/**
 * Get cached jobs list
 * @returns Parsed jobs array or null if not cached/invalid
 */
export const getCachedJobs = (): HarvestJob[] | null => {
  try {
    const cached = cache.get(CACHE_KEY_JOBS_OPEN);
    if (!cached) return null;
    return JSON.parse(cached) as HarvestJob[];
  } catch (err) {
    console.error("Failed to parse cached jobs:", err);
    return null;
  }
};

/**
 * Set cached jobs list with timestamp
 */
export const setCachedJobs = (jobs: HarvestJob[]): void => {
  try {
    cache.set(CACHE_KEY_JOBS_OPEN, JSON.stringify(jobs));
    cache.set(`${CACHE_KEY_JOBS_OPEN}:updatedAt`, new Date().toISOString());
  } catch (err) {
    console.error("Failed to cache jobs:", err);
  }
};

/**
 * Get cached pipeline data for a job
 * @param jobId - Job ID
 * @returns Parsed pipeline data or null if not cached/invalid
 */
export const getCachedPipeline = (jobId: number): JobPipelineData | null => {
  try {
    const key = `${CACHE_KEY_PIPELINE_PREFIX}${jobId}`;
    const cached = cache.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as JobPipelineData;
  } catch (err) {
    console.error(`Failed to parse cached pipeline for job ${jobId}:`, err);
    return null;
  }
};

/**
 * Set cached pipeline data for a job with timestamp
 */
export const setCachedPipeline = (jobId: number, data: JobPipelineData): void => {
  try {
    const key = `${CACHE_KEY_PIPELINE_PREFIX}${jobId}`;
    cache.set(key, JSON.stringify(data));
    cache.set(`${key}:updatedAt`, new Date().toISOString());
  } catch (err) {
    console.error(`Failed to cache pipeline for job ${jobId}:`, err);
  }
};
```

**Acceptance Criteria:**
- ✓ Cache utilities module created at src/cache/cacheUtils.ts
- ✓ get/set functions for jobs and pipeline data
- ✓ Error handling for JSON parse failures
- ✓ Timestamps stored for cache invalidation
- ✓ `npm run build` succeeds

---

### US-021: Migrate JobsList to useCachedPromise
**Status:** NOT IMPLEMENTED ❌
**Effort:** 30 minutes

**File:** `src/jobs/JobsList.tsx`

**Current State:**
- Lines 32-34: Uses `useState` for jobs, isLoading, error
- Lines 36-71: Uses `useEffect` for data fetching with cleanup
- Lines 48-57: Error handling with toast

**Changes Required:**

1. **Add imports:**
```typescript
import { useCachedPromise } from "@raycast/utils";
import { getCachedJobs, setCachedJobs } from "../cache/cacheUtils";
```

2. **Replace useState + useEffect with useCachedPromise:**
```typescript
// REMOVE lines 32-71 (useState + useEffect)

// ADD:
const { data: jobs = [], isLoading } = useCachedPromise(
  async () => fetchOpenJobs(client),
  [],
  {
    initialData: getCachedJobs() ?? undefined,
    onData: (data) => setCachedJobs(data),
    onError: async (err) => {
      const errorDisplay = getHarvestErrorDisplay(err, "jobs");
      if (errorDisplay.toastTitle) {
        await showToast({
          style: Toast.Style.Failure,
          title: errorDisplay.toastTitle,
          message: errorDisplay.toastMessage,
        });
      }
    },
  }
);
```

3. **Update EmptyView to use error from useCachedPromise:**
```typescript
// Keep error state for EmptyView display:
const [error, setError] = useState<HarvestErrorDisplay | null>(null);

// Update onError to set error state:
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
}
```

**Acceptance Criteria:**
- ✓ JobsList shows cached data immediately (no spinner on first load)
- ✓ Data revalidates in background after mount
- ✓ Error handling preserved (toasts + empty view)
- ✓ `npm run build` succeeds
- ✓ Test in Raycast: instant load with cached data

---

### US-022: Migrate JobPipeline to useCachedPromise
**Status:** NOT IMPLEMENTED ❌
**Effort:** 30 minutes

**File:** `src/jobs/JobPipeline.tsx`

**Current State:**
- Lines 47-53: Uses `useState` for stages, applications, candidates, isLoading, error
- Lines 55-94: Uses `useEffect` for data fetching with cleanup
- Lines 70-80: Error handling with toast

**Changes Required:**

1. **Add imports:**
```typescript
import { useCachedPromise } from "@raycast/utils";
import { getCachedPipeline, setCachedPipeline } from "../cache/cacheUtils";
```

2. **Replace useState + useEffect with useCachedPromise:**
```typescript
// REMOVE lines 47-94 (useState + useEffect)

// ADD:
const { data: pipelineData, isLoading } = useCachedPromise(
  async (jobId) => fetchJobPipelineData(client, jobId),
  [job.id],
  {
    initialData: getCachedPipeline(job.id) ?? undefined,
    onData: (data) => setCachedPipeline(job.id, data),
    onError: async (err) => {
      const errorDisplay = getHarvestErrorDisplay(err, "pipeline");
      setError(errorDisplay);
      if (errorDisplay.toastTitle) {
        await showToast({
          style: Toast.Style.Failure,
          title: errorDisplay.toastTitle,
          message: errorDisplay.toastMessage,
        });
      }
    },
  }
);

// Destructure data (similar to existing pattern):
const stages = pipelineData?.stages ?? [];
const applications = pipelineData?.applications ?? [];
const candidates = pipelineData?.candidates ?? {};

// Keep error state for EmptyView:
const [error, setError] = useState<HarvestErrorDisplay | null>(null);
```

3. **Update sections useMemo** (already exists at lines 96-99):
```typescript
// No change needed - already uses applications and stages
const sections = useMemo(
  () => buildPipelineSections(applications, stages),
  [applications, stages],
);
```

**Acceptance Criteria:**
- ✓ JobPipeline shows cached data immediately (no spinner on first load)
- ✓ Data revalidates in background after mount
- ✓ Error handling preserved (toasts + empty view)
- ✓ Candidate URLs continue to work with recruitingBaseUrl preference
- ✓ `npm run build` succeeds
- ✓ Test in Raycast: instant load with cached data

---

### US-023: Create background refresh command
**Status:** NOT IMPLEMENTED ❌
**Effort:** 30 minutes

**Create:** `src/refresh-cache.ts` (new file)

**Purpose:**
- Fetch all open jobs
- For each job, fetch pipeline data (stages, applications, candidates)
- Write to cache using cache utilities
- Handle rate limits gracefully
- Run hourly in background

**Implementation:**
```typescript
import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { HarvestClient } from "./api/harvest";
import { fetchOpenJobs, fetchJobPipelineData } from "./jobs/harvestData";
import { setCachedJobs, setCachedPipeline } from "./cache/cacheUtils";

export default async function RefreshCacheCommand() {
  const preferences = getPreferenceValues<{
    harvestApiKey: string;
    harvestBaseUrl?: string;
  }>();

  const client = new HarvestClient({
    apiKey: preferences.harvestApiKey,
    baseUrl: preferences.harvestBaseUrl,
  });

  try {
    // Fetch and cache jobs list
    const jobs = await fetchOpenJobs(client);
    setCachedJobs(jobs);

    // Fetch and cache pipeline data for each job
    let successCount = 0;
    let errorCount = 0;

    for (const job of jobs) {
      try {
        const pipelineData = await fetchJobPipelineData(client, job.id);
        setCachedPipeline(job.id, pipelineData);
        successCount++;
      } catch (err) {
        // Log but continue with other jobs (rate limits, etc.)
        console.error(`Failed to refresh pipeline for job ${job.id}:`, err);
        errorCount++;
      }
    }

    // Success notification
    await showToast({
      style: Toast.Style.Success,
      title: "Cache refreshed",
      message: `Updated ${successCount} jobs${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
    });
  } catch (err) {
    // Jobs list fetch failed
    await showToast({
      style: Toast.Style.Failure,
      title: "Cache refresh failed",
      message: String(err),
    });
  }
}
```

**Acceptance Criteria:**
- ✓ Background command fetches all data without showing UI
- ✓ Caches jobs list and all pipeline data
- ✓ Handles errors gracefully (doesn't crash)
- ✓ Shows success/failure notification
- ✓ Rate limit errors logged but don't stop refresh
- ✓ `npm run build` succeeds

---

### US-024: Add background command to manifest
**Status:** NOT IMPLEMENTED ❌
**Effort:** 5 minutes

**Files:** `package.json` (primary manifest)

**Changes Required:**
```json
// package.json:36-44 - ADD second command entry:
{
  "commands": [
    {
      "name": "index",
      "title": "Greenhouse",
      "description": "Browse Greenhouse jobs and pipelines",
      "mode": "view",
      "icon": "assets/command-icon.png"
    },
    {
      "name": "refresh-cache",
      "title": "Refresh Greenhouse Cache",
      "description": "Background refresh of cached jobs and pipeline data",
      "mode": "no-view",
      "interval": "1h"
    }
  ]
}
```

**Notes:**
- Background command will appear in Raycast search
- Runs automatically every hour
- Can be manually triggered via search

**Acceptance Criteria:**
- ✓ Background command entry in package.json
- ✓ Command runs hourly automatically
- ✓ `npm run build` succeeds
- ✓ Test in Raycast: command appears in search
- ✓ Test in Raycast: manual trigger works

---

## 📋 MANUAL TASKS (Not Automated)

### Extension Icon Update
**Status:** Requires human action - NOT AUTOMATED
**Effort:** 15 minutes

**Current State:**
- `assets/command-icon.png` exists
- References correct in package.json:6 and package.json:42
- May not be official Greenhouse logo

**Required:**
- Download official Greenhouse logo (512x512 PNG)
- Save to `assets/command-icon.png` (replace existing)
- Verify it looks good in light/dark themes
- Test in Raycast

**Manual Steps:**
1. Obtain official Greenhouse logo from brand assets or greenhouse.io
2. Resize to 512x512 PNG format
3. Replace `assets/command-icon.png`
4. Test in Raycast: verify icon appears correctly in light mode
5. Test in Raycast: verify icon appears correctly in dark mode

**Acceptance Criteria:**
- ✓ Official Greenhouse logo at 512x512 PNG resolution
- ✓ Icon displays correctly in both light and dark themes
- ✓ Icon appears in Raycast search results
- ✓ Icon appears in extension preferences

---

## 🔍 VERIFICATION CHECKLIST

After implementing all tasks, verify:

### Build & Test
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [x] `npm test` passes (all 13 tests)
- [x] `npm run lint` passes
- [x] `npx tsc --noEmit` passes

### Raycast Testing
- [ ] "Greenhouse" command opens jobs list immediately (US-017)
- [ ] No empty-state flash while loading (US-013)
- [ ] Jobs list shows cached data instantly on first open (US-021)
- [ ] Pipeline shows cached data instantly when opened (US-022)
- [ ] Stage headings show counts (US-018) - already implemented ✓
- [ ] Background refresh command appears in search (US-024)
- [ ] Background refresh runs and caches data (US-023)
- [ ] Manual background refresh trigger works
- [ ] Extension icon displays correctly (manual task)

### Edge Cases
- [ ] Empty baseUrl preference falls back to default (US-015) - already implemented ✓
- [ ] Error toasts appear on API failures
- [x] Empty view appears only when loading completes with no data (US-013)
- [ ] Deep links to candidates work correctly

---

## 📊 PRIORITY SUMMARY

### Phase 1: Quick UX Wins (Do First) - ~15 minutes
1. ✅ **US-018** - Stage counts (VERIFIED: already implemented at JobPipeline.tsx:121)
2. ✅ **US-015** - Base URL normalization (VERIFIED: already implemented at harvest.ts:47-48)
3. ✅ **US-013** - Fix empty-state flash (JobsList.tsx:75, JobPipeline.tsx:108)
4. ✅ **US-017** - Direct launch (index.tsx:1-3)

### Phase 2: Infrastructure Cleanup (Do Second) - ~20 minutes
5. ❌ **US-016** - Remove raycast.json (verified safe to delete)

### Phase 3: Caching Implementation (Do Third) - ~2-3 hours
6. ❌ **US-019** - Install @raycast/utils (npm install)
7. ❌ **US-020** - Create cache utilities module (new file)
8. ❌ **US-021** - Migrate JobsList to useCachedPromise
9. ❌ **US-022** - Migrate JobPipeline to useCachedPromise
10. ❌ **US-023** - Create background refresh command (new file)
11. ❌ **US-024** - Add background command to manifest

### Manual Tasks
- Extension icon replacement (human action required)

---

## 🚨 IMPORTANT NOTES

### Implementation Rules
- **DO NOT implement** - this is a planning document only
- All implementations must pass `npm test`, `npm run build`, and `npm run lint`
- Test in Raycast after each phase to verify functionality
- Maintain error handling patterns (toasts, empty views)
- Follow existing code style and conventions

### Verified Findings
- ✅ **US-015** base URL normalization VERIFIED at src/api/harvest.ts:47-48
- ✅ **US-013** empty-state flash fix VERIFIED at src/jobs/JobsList.tsx:75 and src/jobs/JobPipeline.tsx:108
- ✅ **US-018** stage counts VERIFIED at src/jobs/JobPipeline.tsx:121
- ✅ **US-017** direct launch VERIFIED at src/index.tsx:1-3
- ✅ **US-016** raycast.json VERIFIED safe to delete (package.json is authoritative)
- ✅ **US-014** test cleanup VERIFIED at src/jobs/harvestData.test.ts:35

### Architecture Decisions
- **Caching strategy**: `useCachedPromise` from @raycast/utils for automatic cache management
- **Cache TTL**: 60 minutes (soft target - stale data shown immediately, then revalidated)
- **Background refresh**: Hourly automatic refresh to keep cache warm
- **Error handling**: Preserve existing toast notifications and empty view patterns
- **Direct launch**: Remove intermediate menu for better UX (specs/direct-launch.md)

### Testing Notes
- Tests currently pass (13/13 passing)
- Global fetch restored in harvestData.test.ts (US-014)
- All caching changes should maintain or add test coverage

---

## 📈 PROGRESS TRACKING

**Analysis Date:** 2026-01-18
**Analyzed By:** 6 parallel Sonnet exploration agents
**Verification Method:** Source code inspection, line-by-line analysis, cross-file verification

**Completion Status:**
- ✅ **Completed:** 5/14 user stories (US-013, US-014, US-015, US-017, US-018)
- ❌ **Remaining:** 8/14 user stories
- 📋 **Manual:** 1 task (icon replacement)

**Effort Estimates:**
- Phase 1 (UX Polish): ~15 minutes
- Phase 2 (Infrastructure): ~20 minutes
- Phase 3 (Caching): ~2-3 hours
- **Total Development Time:** ~3-4 hours

**Dependencies:**
- US-021, US-022, US-023, US-024 all depend on US-019 and US-020
- US-024 depends on US-023 (command must exist before adding to manifest)
- No blockers identified - all tasks can proceed

---

## 📚 REFERENCES

**Specifications:**
- specs/SPEC.md - Overall UX + caching spec
- specs/direct-launch.md - US-017 direct launch specification
- specs/stage-counts.md - US-018 stage counts specification (implemented ✓)
- specs/caching.md - US-019 through US-024 caching specifications

**Implementation Files:**
- src/index.tsx - Root command (US-017)
- src/jobs/JobsList.tsx - Jobs list view (US-013, US-021)
- src/jobs/JobPipeline.tsx - Pipeline view (US-013, US-018 ✓, US-022)
- src/api/harvest.ts - API client (US-015 ✓)
- src/jobs/harvestData.ts - Data fetching utilities
- src/jobs/harvestData.test.ts - Test file (US-014)
- package.json - Manifest (US-016, US-019, US-024)
- raycast.json - Legacy manifest (US-016 - to be removed)

**Analysis Agents:**
- Agent a95d0df - US-015 base URL normalization verification
- Agent a0d4636 - US-018 stage counts verification
- Agent abc6c5c - US-013 empty state flash verification
- Agent abd3804 - US-017 direct launch verification
- Agent a00787b - US-016 raycast.json analysis
- Agent a53f76f - US-014 test cleanup verification

---

*End of Implementation Plan*
