/** 导出前脱敏工具。 */
export const PrivacyRedactor = {
  /** 将 11 位手机号中间四位替换为 `****`；其它输入原样返回。 */
  maskPhone(phone?: string | null): string | undefined {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 11) return phone;
    return `${digits.slice(0, 3)}****${digits.slice(7)}`;
  },

  /** 对文本中的 11 位连续数字做脱敏。 */
  maskPhonesInText(text: string): string {
    return text.replace(/\d{11}/g, (match) => PrivacyRedactor.maskPhone(match) ?? match);
  },
};
