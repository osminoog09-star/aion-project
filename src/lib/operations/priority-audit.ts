import type {
  PriorityChangeRecord,
  StrategicPrioritiesPayload,
  StrategicPriorityItem,
} from "@/lib/ecosystem-types";

function record(
  changes: PriorityChangeRecord[],
  path: string,
  previousValue: string | undefined,
  newValue: string | undefined,
  affectedSubsystemIds?: string[],
): void {
  const before = previousValue ?? "";
  const after = newValue ?? "";
  if (before === after) return;
  changes.push({ path, previousValue: before, newValue: after, affectedSubsystemIds });
}

function priorityValue(priority: StrategicPriorityItem): string {
  return `${priority.level} / ${priority.status}`;
}

export function diffStrategicPriorities(
  previous: StrategicPrioritiesPayload,
  next: StrategicPrioritiesPayload,
): PriorityChangeRecord[] {
  const changes: PriorityChangeRecord[] = [];
  record(changes, "ownerDirective", previous.ownerDirective, next.ownerDirective, []);
  record(changes, "executionNotes", previous.executionNotes, next.executionNotes);
  record(
    changes,
    "nextImplementationTarget",
    previous.nextImplementationTarget,
    next.nextImplementationTarget,
  );

  const previousById = new Map(previous.priorities.map((priority) => [priority.id, priority]));
  const nextById = new Map(next.priorities.map((priority) => [priority.id, priority]));

  for (const priority of next.priorities) {
    const old = previousById.get(priority.id);
    if (!old) {
      record(changes, `priorities.${priority.id}`, "(missing)", priorityValue(priority), priority.subsystemIds);
      continue;
    }
    const fields: (keyof StrategicPriorityItem)[] = [
      "title",
      "level",
      "status",
      "rationale",
      "nextAction",
      "executionNotes",
    ];
    for (const field of fields) {
      record(
        changes,
        `priorities.${priority.id}.${field}`,
        String(old[field] ?? ""),
        String(priority[field] ?? ""),
        priority.subsystemIds,
      );
    }
    record(
      changes,
      `priorities.${priority.id}.subsystemIds`,
      [...old.subsystemIds].sort().join(","),
      [...priority.subsystemIds].sort().join(","),
      priority.subsystemIds,
    );
  }

  for (const priority of previous.priorities) {
    if (!nextById.has(priority.id)) {
      record(changes, `priorities.${priority.id}`, priorityValue(priority), "(removed)", priority.subsystemIds);
    }
  }

  return changes;
}
