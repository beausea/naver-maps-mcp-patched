/**
 * 로깅 유틸리티
 * 서버 로깅 관리를 위한 유틸리티 모듈입니다.
 */

// 로그 레벨 정의
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 환경 변수에서 로그 레벨 가져오기 (기본값: info)
const currentLogLevel = process.env.LOG_LEVEL || 'info';

/**
 * 로거 객체
 */
const logger = {
  /**
   * 에러 로그 출력
   * @param {string} message - 로그 메시지
   * @param {Error|object} [error] - 에러 객체 또는 추가 정보
   */
  error: (message, error) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, error ? error : '');
    }
  },

  /**
   * 경고 로그 출력
   * @param {string} message - 로그 메시지
   * @param {object} [data] - 추가 데이터
   */
  warn: (message, data) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.warn) {
      console.error(`[WARN] ${message}`, data ? data : '');
    }
  },

  /**
   * 정보 로그 출력
   * @param {string} message - 로그 메시지
   * @param {object} [data] - 추가 데이터
   */
  info: (message, data) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.info) {
      console.error(`[INFO] ${message}`, data ? data : '');
    }
  },

  /**
   * 디버그 로그 출력
   * @param {string} message - 로그 메시지
   * @param {object} [data] - 추가 데이터
   */
  debug: (message, data) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.debug) {
      console.error(`[DEBUG] ${message}`, data ? data : '');
    }
  }
};

export default logger;