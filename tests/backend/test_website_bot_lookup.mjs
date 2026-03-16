import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCompanyPromptHint,
  extractCompanyCandidates,
  findApprovedCompanyMatch,
  normalizeForLookup,
} from "../../supabase/functions/_shared/companyLookup.ts";

test("normalizes candidate variations for Vetmaker", () => {
  assert.equal(normalizeForLookup("VETMAKER"), "vetmaker");
  assert.equal(normalizeForLookup("vet maker"), "vetmaker");
  assert.equal(normalizeForLookup("Vetmáker"), "vetmaker");
});

test("matches Vetmaker on exact, spaced, and minor typo inputs", () => {
  const exact = findApprovedCompanyMatch(extractCompanyCandidates("tem alguma fabricação para a empresa VETMAKER"));
  const spaced = findApprovedCompanyMatch(extractCompanyCandidates("tem alguma fabricação para a empresa vet maker"));
  const typo = findApprovedCompanyMatch(extractCompanyCandidates("tem alguma fabricação para a empresa Vetmakr"));

  assert.equal(exact?.matchedCompany, "Vetmaker");
  assert.equal(exact?.matchType, "exact");

  assert.equal(spaced?.matchedCompany, "Vetmaker");
  assert.equal(spaced?.matchType, "exact");

  assert.equal(typo?.matchedCompany, "Vetmaker");
  assert.equal(typo?.matchType, "fuzzy");
});

test("does not auto-confirm weak match for TMAKER", () => {
  const weak = findApprovedCompanyMatch(extractCompanyCandidates("tem alguma fabricação para a empresa TMAKER c"));
  assert.equal(weak, null);
});

test("builds approved portfolio hint for Vetmaker", () => {
  const match = findApprovedCompanyMatch(extractCompanyCandidates("tem alguma fabricação para a empresa VETMAKER"));
  const hint = buildCompanyPromptHint(match);
  const normalizedHint = hint.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  assert.match(hint, /Vetmaker/);
  assert.match(normalizedHint, /portfolio aprovado/);
});
