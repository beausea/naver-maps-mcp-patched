/**
 * 네이버 지도 API 클라이언트
 * 네이버 Maps API와의 통신을 담당하는 클라이언트 모듈입니다.
 */

import axios from 'axios';
import config from '../utils/config.js';
import logger from '../utils/logger.js';

// 네이버 API 기본 URL
const NAVER_API_BASE_URL = 'https://maps.apigw.ntruss.com';

// API 경로
const API_PATHS = {
  GEOCODE: '/map-geocode/v2/geocode',  // 실제 API 경로는 /map-geocode/v2/geocode 임
  REVERSE_GEOCODE: '/map-reversegeocode/v2/gc',
  DIRECTIONS5: '/map-direction/v1/driving',
  DIRECTIONS15: '/map-direction-15/v1/driving'
};

// 네이버 API 키 확인 및 로깅
logger.info('네이버 API 인증 정보 확인 중...');
logger.info(`현재 설정된 값: ClientID=${config.naver.clientId || '없음'}, ClientSecret=${config.naver.clientSecret ? '설정됨' : '없음'}`);

if (!config.naver.clientId || !config.naver.clientSecret) {
  logger.error('네이버 API 인증 정보가 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경 변수를 확인해주세요.');
  // 환경 변수 직접 확인
  logger.error(`환경 변수 확인: NAVER_CLIENT_ID=${process.env.NAVER_CLIENT_ID || '없음'}, NAVER_CLIENT_SECRET=${process.env.NAVER_CLIENT_SECRET ? '설정됨' : '없음'}`);
}

/**
 * axios 인스턴스 생성 (기본 설정 포함)
 */
// API 요청마다 최신 환경 변수를 사용하도록 함수화
const getApiClient = () => {
  // 우선순위: 
  // 1. 환경 변수에서 직접 가져오기
  // 2. config 객체에서 가져오기
  // 3. 더미 데이터 사용 순서
  const clientId = process.env.NAVER_CLIENT_ID || config.naver.clientId;
  const clientSecret = process.env.NAVER_CLIENT_SECRET || config.naver.clientSecret;
  
  // API 키 유효성 간단한 검증
  if (!clientId || !clientSecret) {
    logger.warn(`인증 정보 미설정 - API 호출이 실패할 수 있습니다. initNaverMapsClient()를 통해 인증 정보를 설정하거나, .env 파일을 확인하세요.`);
  } else {
    // 디버깅 모드에서는 API 키 일부를 로깅하여 식별 용이하게 함
    if (config.server.debug) {
      logger.debug(`API 키 확인 - Client ID: ${clientId.substring(0, 4)}***, Client Secret: ${clientSecret.substring(0, 4)}***`);
    } else {
      logger.debug(`API 클라이언트 생성: clientId=${clientId ? '설정됨' : '없음'}, clientSecret=${clientSecret ? '설정됨' : '없음'}`);
    }
  }
  
  // axios 인스턴스 생성
  const client = axios.create({
    baseURL: NAVER_API_BASE_URL,
    headers: {
      'x-ncp-apigw-api-key-id': clientId,
      'x-ncp-apigw-api-key': clientSecret,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json'
    },
    // 타임아웃 설정
    timeout: config.api.timeout
  });
  
  // 인터셉터 설정 - 요청 정보 로깅
  client.interceptors.request.use(
    reqConfig => {
      if (config.server.debug) {
        logger.debug(`요청 URL: ${reqConfig.baseURL}${reqConfig.url}`, { 
          params: reqConfig.params, 
          headers: reqConfig.headers 
        });
      }
      return reqConfig;
    },
    error => {
      logger.error('요청 생성 중 오류', error);
      return Promise.reject(error);
    }
  );

  // 인터셉터 설정 - 응답 정보 로깅
  client.interceptors.response.use(
    response => {
      if (config.server.debug) {
        logger.debug(`응답 상태코드: ${response.status}`, { 
          data: response.data 
        });
      }
      return response;
    },
    error => {
      logger.error(`API 요청 실패: ${error.message}`);
      if (error.response) {
        logger.error(`응답 상태코드: ${error.response.status}`, { 
          data: error.response.data 
        });
      }
      return Promise.reject(error);
    }
  );
  
  return client;
};

// 기본 apiClient 인스턴스 생성 (인터셉터 설정용)
const apiClient = getApiClient();

apiClient.interceptors.request.use(
  config => {
    logger.debug(`Naver API 요청: ${config.url}`, { headers: config.headers, params: config.params });
    return config;
  },
  error => {
    logger.error('API 요청 생성 중 오류 발생', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정 (에러 로깅)
apiClient.interceptors.response.use(
  response => response,
  error => {
    const errorData = error.response?.data || error.message;
    logger.error(`Naver API 요청 실패: ${error.config?.url || '알 수 없는 엔드포인트'}`, errorData);
    return Promise.reject(error);
  }
);

// 더미 데이터 (API 키가 없거나 API 호출이 실패했을 때 사용)
const DUMMY_DATA = {
  geocode: {
    status: 'OK',
    meta: {
      totalCount: 1,
      page: 1,
      count: 1
    },
    addresses: [
      {
        roadAddress: '서울특별시 강남구 테헤란로 129',
        jibunAddress: '서울특별시 강남구 역삼동 823',
        x: '127.0269218',
        y: '37.5014274',
        distance: 0
      }
    ],
    errorMessage: '(주의) 이 데이터는 API 키 문제로 인해 생성된 더미 데이터입니다.'
  },
  reverseGeocode: {
    status: {
      code: 0,
      name: 'ok',
      message: 'done'
    },
    results: [
      {
        name: 'roadaddr',
        code: {
          id: '1114016200',
          type: 'L',
          mappingId: '01114016200'
        },
        region: {
          area0: {
            name: '한국',
            coords: {
              center: {
                crs: '',
                x: 126.98,
                y: 37.5633
              }
            }
          },
          area1: {
            name: '서울특별시',
            coords: {
              center: {
                crs: '',
                x: 126.978,
                y: 37.5665
              }
            },
            alias: '서울'
          },
          area2: {
            name: '강남구',
            coords: {
              center: {
                crs: '',
                x: 127.0482,
                y: 37.514
              }
            }
          },
          area3: {
            name: '역삼동',
            coords: {
              center: {
                crs: '',
                x: 127.0359,
                y: 37.5017
              }
            }
          },
          area4: {
            name: '823',
            coords: {
              center: {
                crs: '',
                x: 127.0271,
                y: 37.5015
              }
            }
          }
        },
        land: {
          type: 'land',
          number1: '823',
          number2: '',
          addition0: {
            type: 'building',
            value: '18'
          },
          addition1: {
            type: 'zipcode',
            value: '06134'
          },
          addition2: {
            type: '',
            value: ''
          },
          addition3: {
            type: '',
            value: ''
          },
          addition4: {
            type: '',
            value: ''
          },
          name: '역삼동'
        },
        warning: '(주의) 이 데이터는 API 키 문제로 인해 생성된 더미 데이터입니다.'
      }
    ],
    errorMessage: '(주의) 이 데이터는 API 키 문제로 인해 생성된 더미 데이터입니다.'
  },
  directions: {
    code: 0,
    message: 'success',
    currentDateTime: '2025-03-26T11:00:00+09:00',
    route: {
      trafast: [
        {
          summary: {
            start: {
              location: [127.0269218, 37.5014274]
            },
            goal: {
              location: [127.0569518, 37.5464674]
            },
            distance: 8580,
            duration: 1340,
            bbox: [[127.0269218, 37.5014274], [127.0569518, 37.5464674]],
            tollFare: 0,
            taxiFare: 10000,
            fuelPrice: 1534
          },
          path: [
            [127.0269218, 37.5014274],
            [127.0289218, 37.5064274],
            [127.0329218, 37.5114274],
            [127.0369218, 37.5214274],
            [127.0409218, 37.5314274],
            [127.0469218, 37.5364274],
            [127.0569518, 37.5464674]
          ],
          section: [
            {
              pointIndex: 0,
              pointCount: 7,
              distance: 8580,
              name: '구간 0',
              congestion: 0,
              speed: 40
            }
          ],
          guide: [
            {
              pointIndex: 0,
              type: 1,
              instructions: '출발',
              distance: 0,
              duration: 0
            },
            {
              pointIndex: 6,
              type: 2,
              instructions: '도착',
              distance: 8580,
              duration: 1340
            }
          ]
        }
      ]
    },
    warning: '(주의) 이 데이터는 API 키 문제로 인해 생성된 더미 데이터입니다.'
  }
};

/**
 * 네이버 Maps API 클라이언트
 */
const naverMapsClient = {
  /**
   * 주소를 좌표로 변환 (지오코딩)
   * @param {string} address - 검색할 주소
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 지오코딩 결과
   */
  async geocode(address, options = {}) {
    try {
      // 입력 주소 로깅 및 체크
      if (!address) {
        logger.error('지오코딩 요청 실패: 주소가 입력되지 않았습니다.');
        throw new Error('주소가 입력되지 않았습니다.');
      }

      // 인코딩 처리는 axios가 자동으로 해주지만, 한글 주소 로깅을 위해 원본 주소 보존
      const originalAddress = address;
      logger.info(`지오코딩 요청 원본 주소: ${originalAddress}`);
      
      // 요청 파라미터 생성
      const params = {
        query: address,  // 검색할 주소 (필수)
      };
      
      // 선택적 파라미터 추가
      if (options.coordinate) {
        // coordinate 형식: '경도,위도'
        if (typeof options.coordinate === 'object' && options.coordinate.longitude && options.coordinate.latitude) {
          params.coordinate = `${options.coordinate.longitude},${options.coordinate.latitude}`;
        } else {
          params.coordinate = options.coordinate;
        }
        logger.debug(`검색 중심 좌표 설정: ${params.coordinate}`);
      }
      
      // filter 파라미터 처리 (문자열 형식 - HCODE@코드1;코드2)
      if (options.filter) {
        if (typeof options.filter === 'string') {
          params.filter = options.filter;
        } else if (typeof options.filter === 'object') {
          // 객체 형태로 넘어온 경우 변환 지원 (backward compatibility)
          const { type, codes } = options.filter;
          if (type && codes && Array.isArray(codes)) {
            params.filter = `${type}@${codes.join(';')}`;
          }
        }
        logger.debug(`검색 결과 필터 설정: ${params.filter}`);
      }
      
      // language 파라미터 처리 (kor, eng)
      if (options.language) {
        params.language = options.language;
        logger.debug(`응답 결과 언어 설정: ${params.language}`);
      }
      
      // 페이지네이션 파라미터 처리
      if (options.page) {
        params.page = options.page;
      }
      
      if (options.count) {
        // 1~100 사이의 값으로 제한
        params.count = Math.min(Math.max(1, options.count), 100);
      }
      
      // 현재 요청 URL 로깅 (디버깅용)
      const requestUrl = `${NAVER_API_BASE_URL}${API_PATHS.GEOCODE}?query=${encodeURIComponent(address)}`;
      logger.debug(`지오코딩 요청 URL: ${requestUrl}`);
      
      // 요청마다 새로운 클라이언트 인스턴스 생성 (최신 API 키 사용)
      const client = getApiClient();
      logger.info(`지오코딩 요청 시작: ${address}`);
      
      // API 키 확인
      const headers = client.defaults.headers;
      if (!headers['x-ncp-apigw-api-key-id'] || !headers['x-ncp-apigw-api-key']) {
        logger.error('API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
        throw new Error('API 키가 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경 변수를 확인해주세요.');
      }
      
      // 요청 전송
      logger.debug('지오코딩 요청 파라미터:', params);
      const response = await client.get(API_PATHS.GEOCODE, { params });
      
      // 응답 로깅 및 검증
      logger.debug('지오코딩 응답 데이터:', response.data);
      
      // 응답이 비었거나 주소 정보가 없는 경우
      if (!response.data || !response.data.addresses || response.data.addresses.length === 0) {
        logger.warn(`지오코딩 결과 없음: ${address}`);
        return {
          status: 'OK',
          meta: {
            totalCount: 0,
            page: 1,
            count: 0
          },
          addresses: [],
          errorMessage: '검색 결과가 없습니다.'
        };
      }
      
      // 응답 데이터 후처리
      // x, y 좌표를 문자열에서 숫자로 변환하는 처리 추가
      if (response.data.addresses && response.data.addresses.length > 0) {
        response.data.addresses = response.data.addresses.map(address => {
          return {
            ...address,
            // 문자열 좌표를 숫자로 변환
            x: parseFloat(address.x),
            y: parseFloat(address.y),
            // 거리가 없는 경우 기본값 0으로 설정
            distance: typeof address.distance === 'number' ? address.distance : 0
          };
        });
      }
      
      // 응답 데이터 후처리 - 좌표 변환 등
      if (response.data.results && response.data.results.length > 0) {
        // region 정보에서 center 좌표 변환
        response.data.results.forEach(result => {
          if (result.region) {
            for (const area of Object.values(result.region)) {
              if (area && area.coords && area.coords.center) {
                // x, y 좌표를 문자열에서 숫자로 변환
                area.coords.center.x = parseFloat(area.coords.center.x);
                area.coords.center.y = parseFloat(area.coords.center.y);
              }
            }
          }
        });
      }
      
      return response.data;
    } catch (error) {
      logger.error(`지오코딩 요청 실패 (주소: ${address})`, error);
      
      // 에러 응답 정보 추가 로깅
      if (error.response) {
        const statusCode = error.response.status;
        logger.error(`응답 상태: ${statusCode}, 데이터:`, error.response.data);
        
        // 400 오류 - 요청 오류
        if (statusCode === 400) {
          logger.error('요청 오류: 파라미터를 확인해주세요.');
        }
        // 500 오류 - 알 수 없는 오류
        else if (statusCode === 500) {
          logger.error('알 수 없는 오류가 발생했습니다: 잠시 후 다시 시도해주세요.');
        }
      } else if (error.request) {
        logger.error('응답을 받지 못했습니다. 네트워크 연결을 확인해주세요.');
      } else {
        logger.error(`요청 생성 중 오류: ${error.message}`);
      }
      
      // 개발 모드이거나 더미 데이터 사용 옵션이 설정된 경우 더미 데이터 반환
      if (process.env.NODE_ENV === 'development' || options.useDummyData || config.server.useDummyDataWhenError) {
        logger.warn(`개발 모드: 지오코딩 더미 데이터 반환 (${address})`);
        
        // 더미 데이터 생성
        const dummyData = {
          ...DUMMY_DATA.geocode,
          query: address,
          errorMessage: `실제 API 요청 실패 (${error.message}). 더미 데이터가 반환되었습니다.`
        };
        
        // x, y 좌표를 문자열에서 숫자로 변환
        if (dummyData.addresses && dummyData.addresses.length > 0) {
          dummyData.addresses = dummyData.addresses.map(address => {
            return {
              ...address,
              x: parseFloat(address.x),
              y: parseFloat(address.y)
            };
          });
        }
        
        return dummyData;
      }
      
      // 프로덕션 모드에서는 에러 그대로 전달
      throw error;
    }
  },

  /**
   * 좌표를 주소로 변환 (역지오코딩)
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 역지오코딩 결과
   */
  async reverseGeocode(latitude, longitude, options = {}) {
    try {
      // 입력 좌표 검증
      if (latitude === undefined || longitude === undefined) {
        logger.error('역지오코딩 요청 실패: 위도 또는 경도가 입력되지 않았습니다.');
        throw new Error('위도 또는 경도가 입력되지 않았습니다.');
      }

      logger.info(`역지오코딩 요청 시작 - 위도: ${latitude}, 경도: ${longitude}`);
      
      const params = {
        coords: `${longitude},${latitude}`,
        output: 'json',
        orders: 'addr,roadaddr'
      };
      
      // coords_type 옵션 처리
      if (options.coords_type) {
        params.coords_type = options.coords_type;
        logger.debug(`좌표체계 형식 설정: ${params.coords_type}`);
      }
      
      // 추가 파라미터 처리
      if (options.orders) {
        params.orders = options.orders;
      }
      if (options.output) {
        params.output = options.output;
      }
      
      // 현재 요청 URL 로깅 (디버깅용)
      const requestUrl = `${NAVER_API_BASE_URL}${API_PATHS.REVERSE_GEOCODE}?coords=${longitude},${latitude}`;
      logger.debug(`역지오코딩 요청 URL: ${requestUrl}`);
      
      // 요청마다 새로운 클라이언트 인스턴스 생성
      const client = getApiClient();
      
      // API 키 확인
      const headers = client.defaults.headers;
      if (!headers['x-ncp-apigw-api-key-id'] || !headers['x-ncp-apigw-api-key']) {
        logger.error('API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
        throw new Error('API 키가 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경 변수를 확인해주세요.');
      }
      
      logger.debug('역지오코딩 요청 파라미터:', params);
      const response = await client.get(API_PATHS.REVERSE_GEOCODE, { params });
      
      // 응답 로깅 및 검증
      logger.debug('역지오코딩 응답 데이터:', response.data);
      
      // 응답이 비었거나 결과가 없는 경우
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        logger.warn(`역지오코딩 결과 없음 - 위도: ${latitude}, 경도: ${longitude}`);
        return {
          status: {
            code: 0,
            name: 'ok',
            message: 'done'
          },
          results: [],
          errorMessage: '검색 결과가 없습니다.'
        };
      }
      
      // 응답 데이터 후처리 - 좌표 변환 등
      if (response.data.results && response.data.results.length > 0) {
        // region 정보에서 center 좌표 변환
        response.data.results.forEach(result => {
          if (result.region) {
            for (const area of Object.values(result.region)) {
              if (area && area.coords && area.coords.center) {
                // x, y 좌표를 문자열에서 숫자로 변환
                area.coords.center.x = parseFloat(area.coords.center.x);
                area.coords.center.y = parseFloat(area.coords.center.y);
              }
            }
          }
        });
      }
      
      // 성공적인 응답
      return response.data;
    } catch (error) {
      logger.error(`역지오코딩 요청 실패 - 위도: ${latitude}, 경도: ${longitude}`, error);
      
      // 에러 응답 정보 추가 로깅
      if (error.response) {
        const statusCode = error.response.status;
        logger.error(`응답 상태: ${statusCode}, 데이터:`, error.response.data);
        
        // 400 오류 - 요청 오류
        if (statusCode === 400) {
          logger.error('요청 오류: 파라미터를 확인해주세요.');
        }
        // 500 오류 - 알 수 없는 오류
        else if (statusCode === 500) {
          logger.error('알 수 없는 오류가 발생했습니다: 잠시 후 다시 시도해주세요.');
        }
      } else if (error.request) {
        logger.error('응답을 받지 못했습니다. 네트워크 연결을 확인해주세요.');
      } else {
        logger.error(`요청 생성 중 오류: ${error.message}`);
      }
      
      // 개발 모드이거나 더미 데이터 사용 옵션이 설정된 경우 더미 데이터 반환
      if (process.env.NODE_ENV === 'development' || options.useDummyData) {
        logger.warn(`개발 모드: 역지오코딩 더미 데이터 반환 - 위도: ${latitude}, 경도: ${longitude}`);
        // 더미 데이터 생성
        const dummyData = {
          ...DUMMY_DATA.reverseGeocode,
          coords: `${longitude},${latitude}`,
          errorMessage: `실제 API 요청 실패 (${error.message}). 더미 데이터가 반환되었습니다.`
        };
        
        // region 정보에서 center 좌표 변환
        if (dummyData.results && dummyData.results.length > 0) {
          dummyData.results.forEach(result => {
            if (result.region) {
              for (const area of Object.values(result.region)) {
                if (area && area.coords && area.coords.center) {
                  // x, y 좌표를 문자열에서 숫자로 변환
                  area.coords.center.x = parseFloat(area.coords.center.x);
                  area.coords.center.y = parseFloat(area.coords.center.y);
                }
              }
            }
          });
        }
        
        return dummyData;
      }
      
      // 프로덕션 모드에서는 에러 그대로 전달
      throw error;
    }
  },

  /**
   * 경로 탐색 (Directions 5)
   * @param {Object} start - 출발 좌표 {latitude, longitude}
   * @param {Object} goal - 도착 좌표 {latitude, longitude}
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 경로 탐색 결과
   */
  async getDirections5(start, goal, options = {}) {
    try {
      const params = {
        start: `${start.longitude},${start.latitude}`,
        goal: `${goal.longitude},${goal.latitude}`,
        option: 'trafast',
        ...options
      };
      
      const response = await apiClient.get(API_PATHS.DIRECTIONS5, { params });
      return response.data;
    } catch (error) {
      logger.error('경로 탐색(Directions 5) 요청 실패', error);
      
      if (error.response) {
        logger.error(`응답 상태: ${error.response.status}, 데이터:`, error.response.data);
      }
      
      // API 오류 그대로 전달
      throw error;
    }
  },

  /**
   * 경유지 포함 경로 탐색 (Directions 15)
   * @param {Object} start - 출발 좌표 {latitude, longitude}
   * @param {Object} goal - 도착 좌표 {latitude, longitude}
   * @param {Array<Object>} waypoints - 경유지 좌표 배열 [{latitude, longitude}, ...]
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 경로 탐색 결과
   */
  async getDirections15(start, goal, waypoints = [], options = {}) {
    try {
      const params = {
        start: `${start.longitude},${start.latitude}`,
        goal: `${goal.longitude},${goal.latitude}`,
        option: 'trafast',
        ...options
      };
      
      // 경유지 추가
      if (waypoints.length > 0) {
        params.waypoints = waypoints
          .map(wp => `${wp.longitude},${wp.latitude}`)
          .join('|');
      }
      
      const response = await apiClient.get(API_PATHS.DIRECTIONS15, { params });
      return response.data;
    } catch (error) {
      logger.error('경로 탐색(Directions 15) 요청 실패', error);
      throw error;
    }
  },
  
  /**
   * 좌표계 변환
   * @param {Object} coords - 변환할 좌표 {x, y}
   * @param {string} fromCoordSys - 원본 좌표계
   * @param {string} toCoordSys - 변환할 좌표계
   * @returns {Object} 변환된 좌표
   */
  transformCoordinates(coords, fromCoordSys, toCoordSys) {
    // 정확한 구현은 네이버 API 문서를 확인하여 구현 필요
    // 현재는 더미 데이터 반환
    return {
      x: coords.x,
      y: coords.y,
      fromCoordSys,
      toCoordSys
    };
  }
};

export default naverMapsClient;