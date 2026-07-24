/** 学生标签预设库，供 TagPicker 等组件快速选择。 */
export const PRESET_STUDENT_TAGS = [
  "学习困难",
  "心理关注",
  "单亲家庭",
  "班干部",
  "待帮扶",
  "体育特长",
  "艺术特长",
  "纪律重点",
] as const;

export type PresetStudentTag = (typeof PRESET_STUDENT_TAGS)[number];
