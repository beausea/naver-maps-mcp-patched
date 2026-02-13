/**
 * 간단한 네이버 지도 MCP 서버 예제
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

const startServer = async () => {
  // 서버 인스턴스 생성
  const server = new Server({
    name: 'naver-maps-mcp-simple',
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  // 도구 목록 처리
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'hello_world',
          description: '인사말을 반환하는 간단한 도구',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '인사할 대상 이름'
              }
            }
          }
        }
      ]
    };
  });

  // 도구 호출 처리
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === 'hello_world') {
      const targetName = args?.name || 'World';
      return {
        content: [
          {
            type: 'text',
            text: `Hello, ${targetName}!`
          }
        ]
      };
    }
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `알 수 없는 도구: ${name}`
        }
      ]
    };
  });

  // 표준 입출력 전송 계층 생성
  const transport = new StdioServerTransport();
  
  try {
    // 서버 시작
    console.error('서버를 시작합니다...');
    await server.connect(transport);
    console.error('서버가 시작되었습니다.');
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer().catch(console.error);