import { describe, expect, it } from "vitest";
import { GradeAnalyzer } from "@/domain/analysis/grade-analyzer";
import { GradeCSVParser } from "@/domain/import/grade-csv-parser";
import { StudentCSVParser } from "@/domain/import/student-csv-parser";
import { PrivacyRedactor } from "@/domain/privacy/privacy-redactor";
import { RecordTypeConfig, ALL_WORK_RECORD_TYPES } from "@/domain/models/work-record-type";

describe("RecordTypeConfig", () => {
  it("covers all work record types", () => {
    for (const type of ALL_WORK_RECORD_TYPES) {
      const config = RecordTypeConfig.configuration(type);
      expect(config.displayName.length).toBeGreaterThan(0);
    }
  });
});

describe("StudentCSVParser", () => {
  it("parses valid roster csv", () => {
    const csv = "学号,姓名,性别\n001,张三,男\n002,李四,女";
    const { rows, errors } = StudentCSVParser.parse(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].studentNo).toBe("001");
  });
});

describe("GradeCSVParser", () => {
  it("parses valid grade csv", () => {
    const csv = "学号,姓名,语文,数学\n001,张三,90,85";
    const { subjects, rows, errors } = GradeCSVParser.parse(csv);
    expect(errors).toHaveLength(0);
    expect(subjects).toEqual(["语文", "数学"]);
    expect(rows[0].scores["语文"]).toBe(90);
  });
});

describe("GradeAnalyzer", () => {
  it("ranks students by total score", () => {
    const report = GradeAnalyzer.analyze(
      [
        { studentNo: "1", studentName: "A", scores: { 语文: 90, 数学: 90 } },
        { studentNo: "2", studentName: "B", scores: { 语文: 70, 数学: 70 } },
      ],
      ["语文", "数学"],
    );
    expect(report.students[0].studentName).toBe("A");
    expect(report.students[0].rank).toBe(1);
  });
});

describe("PrivacyRedactor", () => {
  it("masks 11 digit phone", () => {
    expect(PrivacyRedactor.maskPhone("13812345678")).toBe("138****5678");
  });
});
