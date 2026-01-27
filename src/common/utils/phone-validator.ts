/**
 * 필리핀 전화번호 검증 유틸리티
 * 필리핀 모바일 번호 형식:
 * - +639XXXXXXXXX (국제 형식)
 * - 09XXXXXXXXX (로컬 형식)
 * - 9XXXXXXXXX (로컬 형식, 0 없이)
 */
export class PhoneValidator {
  /**
   * 필리핀 모바일 번호인지 검증
   * @param phone 전화번호 (예: +639123456789, 09123456789, 9123456789)
   * @returns true if valid Philippine mobile number
   */
  static isValidPhilippineMobile(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // 공백 제거
    const cleaned = phone.trim();

    // 필리핀 모바일 번호 패턴
    // +63로 시작하고 그 다음 9로 시작하는 10자리 숫자
    // 또는 09로 시작하는 11자리 숫자
    // 또는 9로 시작하는 10자리 숫자
    const patterns = [
      /^\+639\d{9}$/,        // +639XXXXXXXXX (국제 형식)
      /^09\d{9}$/,           // 09XXXXXXXXX (로컬 형식)
      /^9\d{9}$/,            // 9XXXXXXXXX (로컬 형식, 0 없이)
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * 전화번호를 Semaphore API 형식으로 변환
   * Semaphore는 09XXXXXXXXX 또는 +639XXXXXXXXX 형식을 받음
   * @param phone 전화번호
   * @returns 정규화된 전화번호 (09XXXXXXXXX 또는 +639XXXXXXXXX)
   */
  static normalizeForSemaphore(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Invalid phone number');
    }

    const cleaned = phone.trim();

    // +63 형식이면 그대로 반환
    if (cleaned.startsWith('+63')) {
      return cleaned;
    }

    // 9로 시작하면 09로 변환
    if (cleaned.startsWith('9') && cleaned.length === 10) {
      return `0${cleaned}`;
    }

    // 이미 09로 시작하면 그대로 반환
    if (cleaned.startsWith('09') && cleaned.length === 11) {
      return cleaned;
    }

    // +63 형식으로 변환
    if (cleaned.startsWith('9') && cleaned.length === 10) {
      return `+63${cleaned}`;
    }

    // 기본적으로 +63 형식으로 변환 시도
    if (cleaned.length === 10 && /^9\d{9}$/.test(cleaned)) {
      return `+63${cleaned}`;
    }

    return cleaned;
  }
}
