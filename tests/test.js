/**
 * 네이버 지도 MCP 서버 테스트
 * MCP 서버의 기능을 확인하기 위한 테스트 코드입니다.
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// 환경 변수 로드
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../');
dotenv.config({ path: resolve(rootDir, '.env') });

// 색상 정의 (콘솔 출력용)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// 테스트 상태 출력 함수들
function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message, error) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`);
  if (error) console.error(error);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bright}${colors.yellow}${message}${colors.reset}`);
}

/**
 * 테스트를 실행합니다.
 */
async function runTests() {
  logHeader('네이버 지도 MCP 서버 테스트');
  
  logInfo('환경 변수 확인 중...');
  // 필수 환경 변수 확인
  const requiredVars = ['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`필요한 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`);
    logInfo('테스트를 실행하려면 .env 파일을 생성하고 필요한 환경 변수를 설정하세요.');
    return;
  }
  
  logSuccess('환경 변수가 올바르게 설정되었습니다.');
  
  // 서버 시작 테스트
  logHeader('서버 시작 테스트');
  logInfo('서버를 시작합니다 (5초 후 종료)...');
  
  try {
    // 서버 프로세스 시작 (별도 프로세스로)
    const serverProcess = spawnSync('node', ['index.js'], {
      cwd: rootDir,
      timeout: 5000,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    if (serverProcess.error) {
      logError('서버 시작 실패', serverProcess.error);
      return;
    }
    
    const output = serverProcess.stdout || '';
    const errorOutput = serverProcess.stderr || '';
    
    if (errorOutput.includes('Error') || errorOutput.includes('error')) {
      logError('서버 시작 중 오류 발생:', errorOutput);
    } else if (output.includes('성공적으로 시작') || !errorOutput) {
      logSuccess('서버가 성공적으로 시작되었습니다.');
    } else {
      logInfo('서버 시작 - 확정할 수 없음, 출력 확인:');
      console.log(output);
      
      if (errorOutput) {
        console.log('오류 출력:');
        console.log(errorOutput);
      }
    }
  } catch (error) {
    logError('서버 시작 테스트 중 오류 발생', error);
  }
  
  // API 클라이언트 테스트
  logHeader('API 클라이언트 테스트');
  logInfo('API 클라이언트를 테스트합니다...');
  
  try {
    // 실제 테스트를 위해 클라이언트 모듈을 가져오고 API 호출을 수행할 수 있음
    // 현재는 직접 API 호출 없이 모듈 가져오기만 테스트
    const { default: naverMapsClient } = await import('../src/api/naverMapsClient.js');
    
    if (naverMapsClient) {
      logSuccess('API 클라이언트 모듈이 성공적으로 로드되었습니다.');
    } else {
      logError('API 클라이언트 모듈 로드 실패');
    }
  } catch (error) {
    logError('API 클라이언트 테스트 중 오류 발생', error);
  }
  
  // 최종 결과
  logHeader('테스트 완료');
  logInfo('모든 테스트가 완료되었습니다. 자세한 테스트를 위해서는 MCP Inspector를 사용하세요.');
  logInfo('MCP Inspector 실행: npx @modelcontextprotocol/inspector node index.js');
}

// 테스트 실행
runTests().catch(error => {
  logError('테스트 실행 중 예상치 못한 오류 발생', error);
  process.exit(1);
});