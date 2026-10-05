import test from "node:test";
import assert from "node:assert/strict";
import { defaultDispatchSchedule, dispatchScheduleSchema, getDispatchStatus, readDispatchSchedule } from "../lib/commerce/dispatch";

test("same-day dispatch uses the requested countdown copy until the exact UK cutoff", () => {
  const before = getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-05T07:59:59Z"));
  assert.equal(before?.title, "Dispatch Today");
  assert.equal(before?.remainingMinutes, 480);
  assert.equal(before?.description, "Order within 8h 0m for same-day dispatch.");
  assert.equal(getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-05T12:37:00Z"))?.description, "Order within 3h 23m for same-day dispatch.");
  assert.equal(getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-05T08:00:00Z"))?.remainingMinutes, 480);
  const lastSecond = getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-05T15:59:59Z"));
  assert.equal(lastSecond?.remainingMinutes, 0);
  assert.match(lastSecond?.description ?? "", /less than a minute/);
  const cutoff = getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-05T16:00:00Z"));
  assert.equal(cutoff?.remainingMinutes, null);
  assert.equal(cutoff?.title, "Dispatch Next Day");
  assert.equal(cutoff?.description, "Order now for dispatch tomorrow.");
});

test("dispatch skips weekends and administrator-configured holidays", () => {
  const friday = getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-09T16:00:00Z"));
  assert.equal(friday?.title, "Dispatch Next Day");
  assert.equal(friday?.description, "Order now for dispatch on Monday 12 Oct.");
  const saturday = getDispatchStatus({ ...defaultDispatchSchedule, closedDates: ["2026-10-12"] }, new Date("2026-10-10T12:00:00Z"));
  assert.equal(saturday?.title, "Dispatch Next Day");
  assert.equal(saturday?.description, "Order now for dispatch on Tuesday 13 Oct.");
  assert.equal(saturday?.remainingMinutes, null);
});

test("UK daylight-saving changes do not change local opening or cutoff hours", () => {
  assert.equal(getDispatchStatus(defaultDispatchSchedule, new Date("2026-07-06T08:00:00Z"))?.remainingMinutes, 480);
  assert.equal(getDispatchStatus(defaultDispatchSchedule, new Date("2026-11-02T09:00:00Z"))?.remainingMinutes, 480);
  assert.match(getDispatchStatus(defaultDispatchSchedule, new Date("2026-10-24T12:00:00Z"))?.description ?? "", /Monday 26 Oct/);
});

test("dispatch respects custom working days and times and can be disabled", () => {
  const custom = { ...defaultDispatchSchedule, workingDays: [6], opensAt: "10:00", cutoffAt: "14:00" };
  assert.equal(getDispatchStatus(custom, new Date("2026-10-10T09:00:00Z"))?.remainingMinutes, 240);
  assert.match(getDispatchStatus(custom, new Date("2026-10-10T13:00:00Z"))?.description ?? "", /Saturday 17 Oct/);
  assert.equal(getDispatchStatus({ ...defaultDispatchSchedule, enabled: false }, new Date()), null);
});

test("invalid schedules cannot publish dispatch claims", () => {
  for (const value of [{ timeZone: "invalid" }, { opensAt: "17:00" }, { cutoffAt: "09:00" }, { workingDays: [] }, { closedDates: ["2026-02-30"] }]) {
    assert.equal(dispatchScheduleSchema.safeParse({ ...defaultDispatchSchedule, ...value }).success, false);
  }
  assert.equal(readDispatchSchedule("bad json"), null);
  assert.equal(readDispatchSchedule(null)?.timeZone, "Europe/London");
  assert.deepEqual(readDispatchSchedule(JSON.stringify(defaultDispatchSchedule)), defaultDispatchSchedule);
});
