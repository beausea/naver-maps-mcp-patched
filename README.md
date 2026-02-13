# Naver Maps MCP Server

[![npm version](https://img.shields.io/npm/v/@devyhan/naver-maps-mcp.svg)](https://www.npmjs.com/package/@devyhan/naver-maps-mcp)

A Model Context Protocol (MCP) server that integrates with Naver Maps API, allowing AI applications like Claude to utilize geographical services such as geocoding, reverse geocoding, and route searching without direct API access.

## Core Concepts

### Geographical Data

Geographical data is represented primarily as coordinates (latitude and longitude) or addresses:

- **Coordinates**: Precise geographical points with latitude and longitude values
  ```json
  {
    "latitude": 37.5058,
    "longitude": 127.0556
  }
  ```

- **Addresses**: Human-readable location references that can be converted to coordinates
  ```
  "서울특별시 강남구 테헤란로 129"
  ```

### Routes

Routes define paths between geographical points:

- **Simple Routes**: Direct paths between start and goal points
- **Waypoint Routes**: Paths that pass through specific intermediate points
- **Natural Language Routes**: Routes defined using human-readable addresses instead of coordinates

### API Features

This MCP server provides the following Naver Maps API features:

- **Geocoding**: Convert addresses to coordinates (latitude, longitude)
- **Reverse Geocoding**: Convert coordinates to addresses
- **Place Search**: Search places based on keywords
- **Route Search**: Provide optimal routes between two points
- **Route Search with Waypoints**: Provide optimal routes including waypoints
- **Natural Language Route Search**: Convert natural language addresses to coordinates and provide optimal routes
- **Natural Language Route Search with Waypoints**: Convert natural language addresses (including waypoints) to coordinates and provide optimal routes
- **Coordinate System Conversion**: Convert between various coordinate systems

## API

### Tools

#### geocode

- **Description**: Convert addresses to coordinates (latitude, longitude)
- **Input**:
  - `address` (string): The address to geocode
  - `filter` (string, optional): Region filter
- **Output**: Geocoding results including coordinates
- **Example**:
  ```json
  {
    "address": "서울특별시 강남구 테헤란로 129"
  }
  ```

#### reverseGeocode

- **Description**: Convert coordinates to addresses
- **Input**:
  - `latitude` (number): Latitude coordinate
  - `longitude` (number): Longitude coordinate
  - `coords_type` (string, optional): Coordinate system type
- **Output**: Address information for the given coordinates
- **Example**:
  ```json
  {
    "latitude": 37.5058,
    "longitude": 127.0556
  }
  ```

#### searchPlaces

- **Description**: Search places based on keywords
- **Input**:
  - `query` (string): Search keyword
  - `coordinate` (object, optional): Center coordinate for search
  - `radius` (number, optional): Search radius in meters
- **Output**: List of matching places with their information

#### getDirections

- **Description**: Provide optimal routes between two points
- **Input**:
  - `start` (object): Starting coordinates with latitude and longitude
  - `goal` (object): Goal coordinates with latitude and longitude
  - `option` (string, optional): Route option (trafast, tracomfort, etc.)
  - `lang` (string, optional): Guide language
- **Output**: Route information including path, summary, and guide
- **Example**:
  ```json
  {
    "start": {
      "latitude": 37.5058,
      "longitude": 127.0556
    },
    "goal": {
      "latitude": 37.5662,
      "longitude": 126.9784
    },
    "option": "trafast"
  }
  ```

#### getDirectionsWithWaypoints

- **Description**: Provide optimal routes including waypoints
- **Input**:
  - `start` (object): Starting coordinates
  - `goal` (object): Goal coordinates
  - `waypoints` (array, optional): List of waypoint coordinates
  - `option` (string, optional): Route option
- **Output**: Route information with waypoints included

#### getDirectionsByNaturalLanguage

- **Description**: Convert natural language addresses to coordinates and provide optimal routes
- **Input**:
  - `startAddress` (string): Starting address as natural language
  - `goalAddress` (string): Goal address as natural language
  - `option` (string, optional): Route option
  - `lang` (string, optional): Guide language
- **Output**: Route information with original address data
- **Example**:
  ```json
  {
    "startAddress": "서울특별시 강남구 테헤란로 129",
    "goalAddress": "서울특별시 중구 명동",
    "option": "trafast"
  }
  ```

#### getDirectionsWithWaypointsByNaturalLanguage

- **Description**: Convert natural language addresses (including waypoints) to coordinates and provide optimal routes
- **Input**:
  - `startAddress` (string): Starting address as natural language
  - `goalAddress` (string): Goal address as natural language
  - `waypointAddresses` (array, optional): List of waypoint addresses
  - `option` (string, optional): Route option
- **Output**: Route information with waypoints and original address data
- **Example**:
  ```json
  {
    "startAddress": "서울특별시 강남구 테헤란로 129",
    "goalAddress": "서울특별시 중구 명동",
    "waypointAddresses": ["서울특별시 용산구 남산", "서울특별시 중구 시청"],
    "option": "trafast"
  }
  ```

#### transformCoordinates

- **Description**: Convert between various coordinate systems
- **Input**:
  - `coords` (object): Coordinates to transform
  - `fromCoordSys` (string): Source coordinate system
  - `toCoordSys` (string): Target coordinate system
- **Output**: Transformed coordinates

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Naver Cloud Platform API credentials (Client ID, Client Secret)

### Installation

1. Install globally from npm:

```bash
npm install -g @devyhan/naver-maps-mcp
```

Or run directly using npx:

```bash
npx @devyhan/naver-maps-mcp
```

2. Set up environment variables (recommended):

```bash
cp .env.example .env
```

Edit the `.env` file to enter your Naver API authentication information:

```
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
```

3. Set API credentials directly when running:

```bash
NAVER_CLIENT_ID=your_client_id NAVER_CLIENT_SECRET=your_client_secret npx @devyhan/naver-maps-mcp
```

4. Use programmatically in your application:

```javascript
import naverMapsMcp from '@devyhan/naver-maps-mcp';

// Initialize with credentials
naverMapsMcp.initNaverMapsClient({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret'
});

// Start the MCP server
naverMapsMcp.startNaverMapsMCP();
```

### Running

```bash
npm start
```

### Testing

```bash
npm test
```

### Testing with MCP Inspector

You can test the server using MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node index.js
```

## Usage with Claude Desktop

### Setup

To use this server with Claude Desktop, add this to your `claude_desktop_config.json`:

#### NPX

```json
{
  "mcpServers": {
    "naverMaps": {
      "command": "npx",
      "args": ["-y", "@devyhan/naver-maps-mcp"],
      "env": {
        "NAVER_CLIENT_ID": "your_client_id_here",
        "NAVER_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

#### Docker

```json
{
  "mcpServers": {
    "naverMaps": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "devyhan/naver-maps-mcp"],
      "env": {
        "NAVER_CLIENT_ID": "your_client_id_here",
        "NAVER_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

### Environment Variables

The server can be configured using the following environment variables:

- `NAVER_CLIENT_ID`: Your Naver Cloud Platform Client ID
- `NAVER_CLIENT_SECRET`: Your Naver Cloud Platform Client Secret
- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level (error, warn, info, debug)

After setting up, restart Claude Desktop.

## Building

### Docker

Build a Docker image:

```bash
docker build -t devyhan/naver-maps-mcp .
```

## Project Structure

```
naver-maps-mcp/
├── index.js              # Entry point
├── package.json          # Project metadata
├── .env.example          # Environment variables example
├── README.md             # Project documentation
├── src/
│   ├── server.js         # MCP server implementation
│   ├── api/
│   │   └── naverMapsClient.js  # Naver API client
│   └── utils/
│       ├── config.js     # Configuration management
│       └── logger.js     # Logging utility
└── tests/
    └── test.js           # Test code
```

## License

ISC

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Naver Cloud Platform Maps API](https://api.ncloud-docs.com/docs/application-maps-overview)
