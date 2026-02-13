#!/usr/bin/env node

/**
 * 네이버 지도 MCP 서버 CLI
 * 명령줄에서 MCP 서버를 실행하기 위한 진입점입니다.
 */

import { startServer } from '../src/server.js';
import logger from '../src/utils/logger.js';

// 명령줄 인수 처리
const args = process.argv.slice(2);
const flags = {};

// 간단한 인수 파싱
args.forEach((arg, index) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = args[index + 1] && !args[index + 1].startsWith('--') 
      ? args[index + 1] 
      : true;
    flags[key] = value;
  }
});

// 도움말 표시
if (flags.help || flags.h) {
  console.error(`
네이버 지도 MCP 서버

사용법:
  naver-maps-mcp [options]

옵션:
  --help, -h       : 도움말 표시
  --port=NUMBER    : 서버 포트 설정 (web-server.js 사용 시)
  --web            : 웹 서버 모드로 실행 (기본: MCP 모드)
  --debug          : 디버그 로그 활성화

예시:
  naver-maps-mcp                   # 기본 MCP 서버 실행
  naver-maps-mcp --web             # 웹 서버 모드로 실행
  naver-maps-mcp --web --port=4000 # 포트 4000번에서 웹 서버 실행
  `);
  process.exit(0);
}

// 환경 변수 설정
if (flags.port) {
  process.env.PORT = flags.port;
}

if (flags.debug) {
  process.env.LOG_LEVEL = 'debug';
}

// 웹 서버 모드 실행
if (flags.web) {
  logger.info('웹 서버 모드로 실행합니다...');
  import('../web-server.js').catch(error => {
    logger.error('웹 서버 실행 중 오류 발생', error);
    process.exit(1);
  });
} else {
  // 기본 MCP 서버 실행
  logger.info('MCP 서버를 시작합니다...');
  startServer().catch(error => {
    logger.error('MCP 서버 실행 중 오류 발생', error);
    process.exit(1);
  });
}
