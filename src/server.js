/**
 * 네이버 지도 MCP 서버
 * 네이버 Maps API를 MCP 프로토콜로 제공하는 서버 구현입니다.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import naverMapsClient from './api/naverMapsClient.js';
import logger from './utils/logger.js';
import config from './utils/config.js';

/**
 * MCP 서버 초기화 및 설정
 * @returns {Promise<void>}
 */
export async function startServer() {
  // 환경 변수 검증
  if (!config.validate()) {
    logger.error('환경 변수 검증 실패. 서버를 시작할 수 없습니다.');
    process.exit(1);
  }

  logger.info('네이버 지도 MCP 서버를 초기화합니다...');

  // MCP 서버 인스턴스 생성
  const server = new Server({
    name: 'naver-maps-mcp',
    version: '1.0.0'
  }, {
    capabilities: {
      // MCP 기능 지원 명시
      tools: {}  // 네이버 지도 API 도구 지원
    }
  });

  // 사용 가능한 도구 목록 제공
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
                enum: ['trafast', 'tracomfort', 'traoptimal', 'traavoidtoll', 'traavoidcaronly'],
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
        
        // 자연어 주소 기반 경로 탐색 도구
        {
          name: 'getDirectionsByNaturalLanguage',
          description: '자연어로 된 출발지와 목적지를 자동으로 지오코딩하여 경로를 제공합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              startAddress: {
                type: 'string',
                description: '출발지 주소 또는 장소명 (자연어)'
              },
              goalAddress: {
                type: 'string',
                description: '도착지 주소 또는 장소명 (자연어)'
              },
              option: {
                type: 'string',
                description: '경로 옵션',
                enum: ['trafast', 'tracomfort', 'traoptimal', 'traavoidtoll', 'traavoidcaronly'],
                default: 'trafast'
              },
              lang: {
                type: 'string',
                description: '안내 언어',
                enum: ['ko', 'en', 'ja', 'zh'],
                default: 'ko'
              }
            },
            required: ['startAddress', 'goalAddress']
          }
        },
        
        // 자연어 주소 기반 경유지 포함 경로 탐색 도구
        {
          name: 'getDirectionsWithWaypointsByNaturalLanguage',
          description: '자연어로 된 출발지, 경유지, 목적지를 자동으로 지오코딩하여 경로를 제공합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              startAddress: {
                type: 'string',
                description: '출발지 주소 또는 장소명 (자연어)'
              },
              goalAddress: {
                type: 'string',
                description: '도착지 주소 또는 장소명 (자연어)'
              },
              waypointAddresses: {
                type: 'array',
                description: '경유지 주소 또는 장소명 목록 (자연어)',
                items: {
                  type: 'string'
                }
              },
              option: {
                type: 'string',
                description: '경로 옵션',
                enum: ['trafast', 'tracomfort', 'traoptimal', 'traavoidtoll', 'traavoidcaronly'],
                default: 'trafast'
              }
            },
            required: ['startAddress', 'goalAddress']
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
                enum: ['trafast', 'tracomfort', 'traoptimal', 'traavoidtoll', 'traavoidcaronly'],
                default: 'trafast'
              }
            },
            required: ['start', 'goal']
          }
        },
        
        // 좌표계 변환 도구
        {
          name: 'transformCoordinates',
          description: '다양한 좌표계 간에 좌표를 변환합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              coords: {
                type: 'object',
                description: '변환할 좌표',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                },
                required: ['x', 'y']
              },
              fromCoordSys: {
                type: 'string',
                description: '원본 좌표계',
                enum: ['EPSG:4326', 'NAVER', 'UTMK', 'TM128', 'BESSEL']
              },
              toCoordSys: {
                type: 'string',
                description: '변환할 좌표계',
                enum: ['EPSG:4326', 'NAVER', 'UTMK', 'TM128', 'BESSEL']
              }
            },
            required: ['coords', 'fromCoordSys', 'toCoordSys']
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
          
        case 'getDirectionsByNaturalLanguage':
          // 자연어 주소 기반 경로 탐색 구현
          try {
            // 1. 출발지 주소를 좌표로 변환 (지오코딩)
            logger.info(`출발지 지오코딩 시작: ${args.startAddress}`);
            const startGeocode = await naverMapsClient.geocode(args.startAddress);
            
            if (!startGeocode?.addresses || startGeocode.addresses.length === 0) {
              throw new Error(`출발지 주소를 변환할 수 없습니다: ${args.startAddress}`);
            }
            
            // 첫 번째 결과 사용
            const startCoord = {
              latitude: parseFloat(startGeocode.addresses[0].y),
              longitude: parseFloat(startGeocode.addresses[0].x)
            };
            
            logger.info(`출발지 변환 결과: ${JSON.stringify(startCoord)}`);
            
            // 2. 도착지 주소를 좌표로 변환 (지오코딩)
            logger.info(`도착지 지오코딩 시작: ${args.goalAddress}`);
            const goalGeocode = await naverMapsClient.geocode(args.goalAddress);
            
            if (!goalGeocode?.addresses || goalGeocode.addresses.length === 0) {
              throw new Error(`도착지 주소를 변환할 수 없습니다: ${args.goalAddress}`);
            }
            
            // 첫 번째 결과 사용
            const goalCoord = {
              latitude: parseFloat(goalGeocode.addresses[0].y),
              longitude: parseFloat(goalGeocode.addresses[0].x)
            };
            
            logger.info(`도착지 변환 결과: ${JSON.stringify(goalCoord)}`);
            
            // 3. 변환된 좌표로 경로 탐색
            const directionsResult = await naverMapsClient.getDirections5(
              startCoord,
              goalCoord,
              {
                option: args.option || 'trafast',
                lang: args.lang || 'ko'
              }
            );
            
            // 4. 원본 주소 정보 추가
            result = {
              ...directionsResult,
              originalAddresses: {
                start: {
                  query: args.startAddress,
                  resolved: startGeocode.addresses[0].roadAddress || startGeocode.addresses[0].jibunAddress,
                  coordinates: startCoord
                },
                goal: {
                  query: args.goalAddress,
                  resolved: goalGeocode.addresses[0].roadAddress || goalGeocode.addresses[0].jibunAddress,
                  coordinates: goalCoord
                }
              }
            };
          } catch (error) {
            logger.error(`자연어 주소 기반 경로 탐색 실패: ${error.message}`, error);
            throw error;
          }
          break;
          
        case 'getDirectionsWithWaypointsByNaturalLanguage':
          // 자연어 주소 기반 경유지 포함 경로 탐색 구현
          try {
            // 1. 출발지 주소를 좌표로 변환 (지오코딩)
            logger.info(`출발지 지오코딩 시작: ${args.startAddress}`);
            const startGeocode = await naverMapsClient.geocode(args.startAddress);
            
            if (!startGeocode?.addresses || startGeocode.addresses.length === 0) {
              throw new Error(`출발지 주소를 변환할 수 없습니다: ${args.startAddress}`);
            }
            
            const startCoord = {
              latitude: parseFloat(startGeocode.addresses[0].y),
              longitude: parseFloat(startGeocode.addresses[0].x)
            };
            
            // 2. 도착지 주소를 좌표로 변환 (지오코딩)
            logger.info(`도착지 지오코딩 시작: ${args.goalAddress}`);
            const goalGeocode = await naverMapsClient.geocode(args.goalAddress);
            
            if (!goalGeocode?.addresses || goalGeocode.addresses.length === 0) {
              throw new Error(`도착지 주소를 변환할 수 없습니다: ${args.goalAddress}`);
            }
            
            const goalCoord = {
              latitude: parseFloat(goalGeocode.addresses[0].y),
              longitude: parseFloat(goalGeocode.addresses[0].x)
            };
            
            // 3. 경유지 주소들을 좌표로 변환 (지오코딩)
            const waypointCoords = [];
            const waypointDetails = [];
            
            if (args.waypointAddresses && args.waypointAddresses.length > 0) {
              for (const waypointAddress of args.waypointAddresses) {
                logger.info(`경유지 지오코딩 시작: ${waypointAddress}`);
                const waypointGeocode = await naverMapsClient.geocode(waypointAddress);
                
                if (!waypointGeocode?.addresses || waypointGeocode.addresses.length === 0) {
                  throw new Error(`경유지 주소를 변환할 수 없습니다: ${waypointAddress}`);
                }
                
                const waypointCoord = {
                  latitude: parseFloat(waypointGeocode.addresses[0].y),
                  longitude: parseFloat(waypointGeocode.addresses[0].x)
                };
                
                waypointCoords.push(waypointCoord);
                waypointDetails.push({
                  query: waypointAddress,
                  resolved: waypointGeocode.addresses[0].roadAddress || waypointGeocode.addresses[0].jibunAddress,
                  coordinates: waypointCoord
                });
              }
            }
            
            // 4. 변환된 좌표로 경로 탐색
            const directionsResult = await naverMapsClient.getDirections15(
              startCoord,
              goalCoord,
              waypointCoords,
              { option: args.option || 'trafast' }
            );
            
            // 5. 원본 주소 정보 추가
            result = {
              ...directionsResult,
              originalAddresses: {
                start: {
                  query: args.startAddress,
                  resolved: startGeocode.addresses[0].roadAddress || startGeocode.addresses[0].jibunAddress,
                  coordinates: startCoord
                },
                goal: {
                  query: args.goalAddress,
                  resolved: goalGeocode.addresses[0].roadAddress || goalGeocode.addresses[0].jibunAddress,
                  coordinates: goalCoord
                },
                waypoints: waypointDetails
              }
            };
          } catch (error) {
            logger.error(`자연어 주소 기반 경유지 포함 경로 탐색 실패: ${error.message}`, error);
            throw error;
          }
          break;
          
        case 'transformCoordinates':
          result = naverMapsClient.transformCoordinates(
            args.coords,
            args.fromCoordSys,
            args.toCoordSys
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

  try {
    // 표준 입출력을 사용하는 전송 계층 생성
    const transport = new StdioServerTransport();
    
    // 서버 시작
    logger.info('네이버 지도 MCP 서버를 시작합니다...');
    await server.connect(transport);
    
    logger.info('네이버 지도 MCP 서버가 시작되었습니다.');
    
    // 프로세스 종료 처리
    process.on('SIGINT', async () => {
      logger.info('서버를 종료합니다...');
      await transport.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('서버 시작 실패', error);
    process.exit(1);
  }
}

// 명령줄에서 직접 실행되는 경우 서버 시작
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    logger.error('서버 실행 중 오류 발생', error);
    process.exit(1);
  });
}