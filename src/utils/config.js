/**
 * 설정 유틸리티
 * 환경 변수 및 구성 설정을 관리하는 모듈입니다.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';
import logger from './logger.js';

// 현재 파일의 디렉토리 경로 구하기
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(__dirname, '../../');

// 다양한 위치에서 .env 파일 찾기
const findEnvFile = () => {
  // 가능한 .env 파일 경로들
  const possiblePaths = [
    // 1. 현재 작업 디렉토리
    process.cwd(),
    // 2. 현재 작업 디렉토리의 상위 디렉토리 (최대 3단계 상위)
    resolve(process.cwd(), '../'),
    resolve(process.cwd(), '../../'),
    resolve(process.cwd(), '../../../'),
    // 3. 패키지 디렉토리
    packageDir,
  ];

  // 각 경로에서 .env 파일 찾기
  for (const basePath of possiblePaths) {
    const envPath = join(basePath, '.env');
    if (fs.existsSync(envPath)) {
      logger.info(`이 위치에서 .env 파일 발견: ${envPath}`);
      return envPath;
    }
  }

  // 기본값으로 패키지 디렉토리 반환
  logger.warn('.env 파일을 찾을 수 없습니다. 패키지 기본 위치를 사용합니다.');
  return join(packageDir, '.env');
};

// .env 파일 로드
const envPath = findEnvFile();
dotenv.config({ path: envPath });

/**
 * 필수 환경 변수 확인
 * @param {string[]} requiredVars - 필요한 환경 변수 목록
 * @returns {boolean} 모든 필수 변수가 존재하는지 여부
 */
function validateEnv(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`필요한 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// 설정 객체
const config = {
  // 네이버 API 인증 정보
  naver: {
    clientId: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET
  },
  
  // 서버 설정
  server: {
    port: process.env.PORT || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    debug: process.env.DEBUG === 'true',
    useDummyDataWhenError: process.env.USE_DUMMY_DATA_WHEN_ERROR === 'true'
  },
  
  // 경로 설정
  paths: {
    root: packageDir
  },
  
  // API 설정
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
    retries: parseInt(process.env.API_RETRIES || '1', 10)
  },
  
  // 환경 변수 검증
  validate() {
    return validateEnv(['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET']);
  }
};

export default config;