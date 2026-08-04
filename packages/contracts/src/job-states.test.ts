import { describe, expect, it } from "vitest";

import {
  JOB_STATES,
  JOB_TRANSITIONS,
  isTerminalJobState,
  isValidJobTransition,
} from "./job-states";

describe("máquina de estados do job", () => {
  it("cobre todos os estados no mapa de transições", () => {
    for (const state of JOB_STATES) {
      expect(JOB_TRANSITIONS[state]).toBeDefined();
    }
  });

  it("estados terminais não têm sucessores (exceto retry de failed)", () => {
    expect(JOB_TRANSITIONS.completed).toEqual([]);
    expect(JOB_TRANSITIONS.cancelled).toEqual([]);
    expect(JOB_TRANSITIONS.expired).toEqual([]);
    expect(JOB_TRANSITIONS.failed).toEqual(["queued"]);
  });

  it("permite o caminho feliz de upload (pulando etapas de link)", () => {
    expect(isValidJobTransition("queued", "extracting_audio")).toBe(true);
    expect(isValidJobTransition("extracting_audio", "normalizing_audio")).toBe(true);
    expect(isValidJobTransition("normalizing_audio", "transcribing")).toBe(true);
    expect(isValidJobTransition("transcribing", "postprocessing")).toBe(true);
    expect(isValidJobTransition("postprocessing", "indexing")).toBe(true);
    expect(isValidJobTransition("indexing", "completed")).toBe(true);
  });

  it("permite diarização opcional", () => {
    expect(isValidJobTransition("transcribing", "diarizing")).toBe(true);
    expect(isValidJobTransition("diarizing", "postprocessing")).toBe(true);
  });

  it("rejeita retrocesso no pipeline", () => {
    expect(isValidJobTransition("transcribing", "acquiring_media")).toBe(false);
    expect(isValidJobTransition("completed", "queued")).toBe(false);
    expect(isValidJobTransition("indexing", "transcribing")).toBe(false);
  });

  it("cancelamento é alcançável de estados ativos e flui para cancelled", () => {
    expect(isValidJobTransition("transcribing", "cancel_requested")).toBe(true);
    expect(isValidJobTransition("queued", "cancel_requested")).toBe(true);
    expect(isValidJobTransition("cancel_requested", "cancelled")).toBe(true);
    expect(isValidJobTransition("cancelled", "queued")).toBe(false);
  });

  it("permite gate de orçamento assim que a duração real é conhecida", () => {
    expect(isValidJobTransition("acquiring_media", "awaiting_user_confirmation")).toBe(true);
    expect(isValidJobTransition("resolving_metadata", "awaiting_user_confirmation")).toBe(true);
    expect(isValidJobTransition("extracting_audio", "awaiting_user_confirmation")).toBe(false);
  });

  it("identifica estados terminais", () => {
    expect(isTerminalJobState("completed")).toBe(true);
    expect(isTerminalJobState("failed")).toBe(true);
    expect(isTerminalJobState("transcribing")).toBe(false);
  });
});
