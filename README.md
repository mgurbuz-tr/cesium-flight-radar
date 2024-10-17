# 3D Flight Radar Application


A desktop application developed using **ElectronJS**, **React**, **Shadcn/UI**, **Tailwind CSS**, and **CesiumJS** technologies. The application aims to provide a 3D visualization of flight data on a world map, allowing users to track and explore flights in real-time or in emulator mode using pre-downloaded data.

![Application Screenshot](https://github.com/mgurbuz-tr/cesium-flight-radar/blob/main/screenshots/cesiumFlightRadar.png?raw=true)
---

## Table of Contents

- [3D Flight Radar Application](#3d-flight-radar-application)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Objectives](#objectives)
    - [Features](#features)
  - [Development Process](#development-process)
    - [Technology Stack](#technology-stack)
    - [Implementation Steps](#implementation-steps)
    - [Challenges Faced](#challenges-faced)
  - [Architecture](#architecture)
    - [System Architecture](#system-architecture)
    - [Components and Modules](#components-and-modules)
    - [Technical Details](#technical-details)
  - [CesiumJS Integration](#cesiumjs-integration)
    - [Role of CesiumJS](#role-of-cesiumjs)
    - [Utilized CesiumJS Features](#utilized-cesiumjs-features)
  - [Code Quality and Optimization](#code-quality-and-optimization)
    - [Code Standards](#code-standards)
    - [Performance Optimization](#performance-optimization)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
    - [Usage](#usage)
---

## Project Overview

### Objectives

- **Real-Time Flight Visualization**: Display real-time flight data on a 3D world map.
- **Emulator Mode**: Allow users to simulate flight tracking using pre-downloaded data.
- **User Interaction**: Provide interactive tools for users to explore flight details and measure distances and areas on the map.
- **User-Friendly Interface**: Design an intuitive UI for seamless user experience.

### Features

- **Dual Mode Operation**: Switch between real-time data via OpenSky Network API and emulator mode.
- **Flight Details**: View detailed information about individual flights.
- **Measurement Tools**: Measure distances and areas directly on the map.
- **Camera Controls**: Navigate through the 3D environment with undo/redo camera movements.
- **KML File Support**: Load and display KML files for additional geographic data.

---

## Development Process

### Technology Stack

- **ElectronJS**: For building the cross-platform desktop application.
- **React**: To create a modular and maintainable user interface.
- **Shadcn/UI and Tailwind CSS**: For consistent and rapid UI design.
- **CesiumJS**: To handle 3D mapping and geospatial data visualization.

### Implementation Steps

1. **Project Setup**: Initialized the ElectronJS project and integrated React for the frontend.
2. **CesiumJS Integration**: Embedded CesiumJS into the application to render the 3D globe.
3. **Data Retrieval**:
   - **API Mode**: Implemented data fetching from the OpenSky Network API with authentication.
   - **Emulator Mode**: Enabled loading of pre-downloaded JSON data files for offline simulation.
4. **Data Visualization**: Mapped flight data onto the CesiumJS globe using entities and models.
5. **User Interface Development**: Designed and implemented the UI components, including the sidebar and measurement tools.
6. **Feature Enhancements**:
   - Added measurement tools for distance and area.
   - Implemented camera control features with undo/redo functionality.
7. **Performance Optimization**: Optimized data processing and rendering for smoother performance.

### Challenges Faced

- **Real-Time Data Processing**: Managing and updating a large set of flight data in real-time without compromising performance.
- **CesiumJS Performance**: Ensuring smooth rendering of 3D models and interactions within CesiumJS.
- **Asynchronous Data Handling**: Coordinating data flow between the main process and renderer process in ElectronJS.
- **Efficient Data Management with Tile Matrix**:
  - **Issue**: Rendering a vast number of flight entities on the globe caused significant performance issues.
  - **Solution**: Implemented a tile matrix system that covers the entire world upon application startup. Flight data entities are assigned to their corresponding tiles in the matrix. On the `CameraOnChange` event, the application identifies which tiles are within the current camera view and retrieves only the first 10 flight data entities from each visible tile. This approach significantly reduces the number of entities being rendered at any one time, thus eliminating performance bottlenecks.

---

## Architecture

### System Architecture

![System Architecture Diagram](https://github.com/mgurbuz-tr/cesium-flight-radar/blob/main/screenshots/diagram.png?raw=true)

### Components and Modules

1. **Main Process (`src/main/index.ts`)**:
   - Handles application startup and window management.
   - Manages data fetching from the OpenSky Network API or local files.
   - Communicates with the renderer process via IPC.

2. **Renderer Process (`src/renderer/src`)**:
   - **App Component (`App.tsx`)**: The root component that orchestrates the application layout.
   - **Map Component (`AppMap.tsx`)**:
     - Initializes the CesiumJS viewer.
     - Manages flight data visualization and user interactions on the map.
   - **Sidebar Component (`AppSidebar.tsx`)**:
     - Displays a list of flights with filtering capabilities.
     - Shows detailed information about selected flights.
   - **Context Providers**:
     - Manage global state for user settings and camera history.

### Technical Details

- **Inter-Process Communication (IPC)**:
  - Utilized Electron's `ipcMain` and `ipcRenderer` for communication between the main and renderer processes.
- **Data Management**:
  - Implemented a tile-based system to partition the world map and efficiently manage flight data.
  - Used React hooks and context for state management within the application.
- **Performance Enhancements**:
  - Leveraged Cesium's `CallbackProperty` for dynamic entity updates.
  - Optimized rendering by updating only entities within the camera's view.

---

## CesiumJS Integration

### Role of CesiumJS

CesiumJS is central to the application, providing the 3D globe and rendering capabilities required to visualize flight data in a geospatial context. It enables:

- High-performance rendering of 3D models and entities.
- Interactive camera controls and user interactions.
- Loading and displaying KML files for additional data layers.

### Utilized CesiumJS Features

- **Viewer Initialization**: Customized Cesium Viewer with specific controls disabled for a cleaner UI.
- **Entities and Primitives**:
  - Represented flights using Cesium `Entity` objects.
  - Used `BillboardGraphics` and `ModelGraphics` for flight icons and 3D models.
- **Data Sources**:
  - Employed `KmlDataSource` to load KML files into the scene.
- **Event Handling**:
  - Implemented `ScreenSpaceEventHandler` for handling user interactions like clicks and mouse movements.
  - Managed camera events to update flight visibility and history.
- **Dynamic Properties**:
  - Used `CallbackProperty` for real-time updates of entity positions .

---

## Code Quality and Optimization

### Code Standards

- **Modular Design**: Broke down code into reusable and maintainable modules and components.
- **Consistent Naming Conventions**: Used clear and descriptive names for variables, functions, and components.
- **Comments and Documentation**: Added comments to explain complex logic and implementation details.
- **Linting and Formatting**: Integrated ESLint and Prettier to maintain code style consistency.

### Performance Optimization

- **Tile-Based Data Partitioning**:
  - Divided the world map into tiles to manage and render only the relevant flight data.
- **Efficient Rendering**:
  - Updated only the entities within the camera's view to reduce unnecessary computations.
- **Memory Management**:
  - Cleaned up unused entities and event listeners to prevent memory leaks.
- **Asynchronous Operations**:
  - Handled data fetching and processing asynchronously to keep the UI responsive.

---
## Getting Started 

### Installation

**Clone the Repository**: 
```bash
git clone https://github.com/mgurbuz-tr/cesium-flight-radar.git
```
-   **Navigate to the Project Directory**:
    
```bash
cd cesium-flight-radar
```

-   **Install Dependencies**:
    
```bash
npm install
```

### Usage

-   **Start the Application**:
    
```bash
npm run dev
```
    
-   **Build the Application**:
    
```bash
npm run build:win
```

**Measurement Tool Details:**

-   **Point, Line, and Area Drawing**: In the Measurement tool, users can draw points, lines, and areas.
    -   **Point**: Displays the coordinates of the clicked location.
    -   **Line**: Shows the distance in kilometers between points on the screen with each left click. The drawing is completed with a right click.
    -   **Area**: Similar to the line tool, it shows the distance between each point. It calculates and displays the area in square kilometers (km²) at the centroid of the geometry.
