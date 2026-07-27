import { describe, expect, it } from "vitest";
import { filterAccounts, type AdminAccount } from "@/lib/auth/admin-api";

const sample: AdminAccount[] = [
  {
    accountId: "1",
    username: "teacher01",
    displayName: "张老师",
    deviceId: "abc-123",
    boundAt: 1000,
    disabled: false,
    createdAt: 1000,
    status: "bound",
  },
  {
    accountId: "2",
    username: "teacher02",
    displayName: "李老师",
    deviceId: null,
    boundAt: null,
    disabled: false,
    createdAt: 2000,
    status: "available",
  },
  {
    accountId: "3",
    username: "teacher03",
    displayName: "王老师",
    deviceId: null,
    boundAt: null,
    disabled: true,
    createdAt: 3000,
    status: "disabled",
  },
];

describe("filterAccounts", () => {
  it("returns all when keyword empty", () => {
    expect(filterAccounts(sample, "")).toHaveLength(3);
  });

  it("filters by username", () => {
    expect(filterAccounts(sample, "teacher02")).toHaveLength(1);
  });

  it("filters by displayName", () => {
    expect(filterAccounts(sample, "张老师")).toHaveLength(1);
  });

  it("filters by status keyword", () => {
    expect(filterAccounts(sample, "禁用")).toHaveLength(1);
  });
});
