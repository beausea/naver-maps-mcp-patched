/**
 * 네이버 지도 MCP 서버 시작점
 * 이 파일은 MCP 서버의 진입점으로, 서버를 초기화하고 시작합니다.
 */

import { startServer } from './src/server.js';
import logger from './src/utils/logger.js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import naverMapsClient from './src/api/naverMapsClient.js';

// 현재 파일의 디렉토리 경로 구하기
const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 파일을 강제로 다시 로드
dotenv.config({ path: resolve(__dirname, '.env'), override: true });

// 환경 변수 로그
logger.info('환경 변수 로드됨:', {
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? '설정됨' : '없음',
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? '설정됨' : '없음'
});

/**
 * 네이버 맵스 클라이언트 구성 초기화 함수
 * @param {Object} config - 구성 객체
 * @param {string} config.clientId - 네이버 클라이언트 ID
 * @param {string} config.clientSecret - 네이버 클라이언트 시크릿
 * @returns {boolean} 초기화 성공 여부
 */
export function initNaverMapsClient(config) {
  if (!config || typeof config !== 'object') {
    logger.error('유효한 구성 객체가 아닙니다. { clientId, clientSecret } 형태의 객체가 필요합니다.');
    return false;
  }

  const { clientId, clientSecret } = config;

  if (!clientId || !clientSecret) {
    logger.error('클라이언트 ID와 시크릿은 필수입니다.');
    return false;
  }

  // 환경 변수에 세팅
  process.env.NAVER_CLIENT_ID = clientId;
  process.env.NAVER_CLIENT_SECRET = clientSecret;

  logger.info('네이버 맵스 클라이언트 구성이 성공적으로 초기화되었습니다.');
  return true;
}

/**
 * 네이버 지도 MCP 서버를 시작합니다.
 * @returns {Promise<void>}
 */
export async function startNaverMapsMCP() {
  logger.info('네이버 지도 MCP 서버를 초기화합니다...');
  
  try {
    await startServer();
    logger.info('네이버 지도 MCP 서버가 성공적으로 시작되었습니다.');
    return true;
  } catch (error) {
    logger.error('서버 시작 중 오류 발생', error);
    return false;
  }
}

// CLI로 실행되었을 때 자동으로 서버 시작
if (import.meta.url === `file://${process.argv[1]}`) {
  startNaverMapsMCP().catch(error => {
    logger.error('서버 시작 중 시스템 오류 발생', error);
    process.exit(1);
  });
}

// 기본 내보내기
export default {
  initNaverMapsClient,
  startNaverMapsMCP
};

// 예기치 않은 오류 처리
process.on('uncaughtException', (error) => {
  logger.error('처리되지 않은 예외 발생', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 프로미스 거부 발생', { reason, promise });
});