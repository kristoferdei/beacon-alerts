import type { RuleOperator } from "../domain/types.ts";

// Source capability metadata, docs/02-architecture.md section 3. The rule
// form is generated from this; it is the only place a source's attributes
// are declared.

export type AttributeDefinition = {
  key: string;
  label: string;
  type: "number" | "string" | "boolean";
  operators: RuleOperator[];
  unit?: string;
};

export type EventSourceDefinition = {
  id: string;
  name: string;
  eventTypes: string[];
  supportsLocation: boolean;
  attributes: AttributeDefinition[];
};
