/**
 * 네이버 지도 MCP 웹 서버
 * 네이버 Maps API를 MCP 프로토콜로 제공하는 웹 서버 구현입니다.
 */

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import naverMapsClient from './src/api/naverMapsClient.js';
import logger from './src/utils/logger.js';
import config from './src/utils/config.js';

// Express 앱 생성
const app = express();
app.use(cors());
app.use(express.json());

// 포트 설정 (Heroku에서는 process.env.PORT를 사용)
const PORT = process.env.PORT || 3000;

// MCP 서버 인스턴스 생성
function createMcpServer() {
  const server = new Server({
    name: 'naver-maps-mcp',
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  // 도구 목록 제공
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('도구 목록 요청 처리');
    
    return {
      tools: [
        // 지오코딩 도구
        {
          name: 'geocode',
          description: '주소를 좌표(위도, 경도)로 변환합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: '검색할 주소'
              },
              filter: {
                type: 'string',
                description: '지역 필터링 (구, 동 등)'
              }
            },
            required: ['address']
          }
        },
        
        // 역지오코딩 도구
        {
          name: 'reverseGeocode',
          description: '좌표(위도, 경도)를 주소로 변환합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              latitude: {
                type: 'number',
                description: '위도'
              },
              longitude: {
                type: 'number',
                description: '경도'
              },
              coords_type: {
                type: 'string',
                description: '좌표계 타입',
                enum: ['latlng', 'utmk', 'tm128', 'epsg', 'naver', 'bessel'],
                default: 'latlng'
              }
            },
            required: ['latitude', 'longitude']
          }
        },
        
        // 장소 검색 도구
        {
          name: 'searchPlaces',
          description: '키워드로 장소를 검색합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '검색 키워드'
              },
              coordinate: {
                type: 'object',
                description: '검색 중심 좌표',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              },
              radius: {
                type: 'number',
                description: '검색 반경 (미터 단위)'
              }
            },
            required: ['query']
          }
        },
        
        // 경로 탐색 도구 (방향 5)
        {
          name: 'getDirections',
          description: '출발지와 목적지 사이의 최적 경로를 제공합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              start: {
                type: 'object',
                description: '출발 좌표',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                },
                required: ['latitude', 'longitude']
              },
              goal: {
                type: 'object',
                description: '도착 좌표',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                },
                required: ['latitude', 'longitude']
              },
              option: {
                type: 'string',
                description: '경로 옵션',
                enum: ['trafast', 'tracomfort', 'traoptimal', 'traavoidtoll'],
                default: 'trafast'
              },
              lang: {
                type: 'string',
                description: '안내 언어',
                enum: ['ko', 'en', 'ja', 'zh'],
                default: 'ko'
              }
            },
            required: ['start', 'goal']
          }
        },
        
        // 경유지 포함 경로 탐색 도구 (방향 15)
        {
          name: 'getDirectionsWithWaypoints',
          description: '경유지를 포함한 최적 경로를 제공합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              start: {
                type: 'object',
                description: '출발 좌표',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                },
                required: ['latitude', 'longitude']
              },
              goal: {
                type: 'object',
                description: '도착 좌표',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                },
                required: ['latitude', 'longitude']
              },
              waypoints: {
                type: 'array',
                description: '경유지 좌표 목록',
                items: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' }
                  },
                  required: ['latitude', 'longitude']
                }
              },
              option: {
                type: 'string',
                description: '경로 옵션',
                enum: ['trafast', 'tracomfort', 'traoptimal', 'traavoidtoll'],
                default: 'trafast'
              }
            },
            required: ['start', 'goal']
          }
        }
      ]
    };
  });

  // 도구 호출 처리
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.debug(`도구 호출: ${name}`, args);
    
    try {
      let result;
      
      // 각 도구별 구현
      switch (name) {
        case 'geocode':
          result = await naverMapsClient.geocode(args.address, {
            filter: args.filter
          });
          break;
          
        case 'reverseGeocode':
          result = await naverMapsClient.reverseGeocode(
            args.latitude,
            args.longitude,
            { coords_type: args.coords_type }
          );
          break;
          
        case 'searchPlaces':
          // 실제 구현은 네이버 API 문서 확인 후 추가 필요
          // 현재는 더미 응답 반환
          result = {
            places: [
              {
                name: '검색 결과 예시',
                address: '서울특별시 강남구',
                location: { latitude: 37.5, longitude: 127.0 }
              }
            ]
          };
          break;
          
        case 'getDirections':
          result = await naverMapsClient.getDirections5(
            args.start,
            args.goal,
            {
              option: args.option,
              lang: args.lang
            }
          );
          break;
          
        case 'getDirectionsWithWaypoints':
          result = await naverMapsClient.getDirections15(
            args.start,
            args.goal,
            args.waypoints || [],
            { option: args.option }
          );
          break;
          
        default:
          throw new Error(`알 수 없는 도구: ${name}`);
      }
      
      // 결과 반환
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`도구 실행 오류: ${name}`, error);
      
      // 오류 결과 반환
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `오류: ${error.message || '알 수 없는 오류'}`
          }
        ]
      };
    }
  });

  return server;
}

// 최소한의 환경 변수 검증 로직
function validateConfig() {
  // 프로덕션 환경에서는 실제 API 키가 설정되어 있어야 함
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      logger.warn('프로덕션 환경에서 네이버 API 키가 설정되지 않았습니다. 더미 데이터가 반환될 수 있습니다.');
    }
  }
  return true;
}

// SSE 엔드포인트 설정
app.get('/mcp', (req, res) => {
  if (!validateConfig()) {
    res.status(500).send('Server configuration error');
    return;
  }
  
  logger.info('SSE 연결 수립 중...');
  const mcpServer = createMcpServer();
  const transport = new SSEServerTransport('/mcp-messages', res);
  
  mcpServer.connect(transport).catch(error => {
    logger.error('MCP 서버 연결 오류:', error);
  });
});

// 메시지 엔드포인트 설정
app.post('/mcp-messages', (req, res) => {
  // SSEServerTransport에서 자동으로 처리
  logger.debug('메시지 수신됨');
});

// 홈페이지
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Naver Maps MCP Server</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          .info { background: #f5f5f5; padding: 20px; border-radius: 5px; }
          code { background: #eee; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Naver Maps MCP Server</h1>
          <div class="info">
            <p>This server provides Naver Maps API functionality through the Model Context Protocol (MCP).</p>
            <p>MCP Endpoint: <code>${req.protocol}://${req.get('host')}/mcp</code></p>
            <p>For more information, visit the <a href="https://github.com/devyhan/naver-maps-mcp" target="_blank">GitHub repository</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// 서버 시작
app.listen(PORT, () => {
  logger.info(`네이버 지도 MCP 서버가 http://localhost:${PORT}에서 실행 중입니다`);
  logger.info(`MCP 엔드포인트: http://localhost:${PORT}/mcp`);
});