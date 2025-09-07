# Development Documentation

This section provides insights into the development practices, architecture, and design decisions made during the creation of the `LineViz` web component. It is intended for developers who want to understand the internal workings of the component or contribute to its development.

## Architecture Overview

The `LineViz` web component is built using TypeScript and follows a modular architecture. The core components include:

- **Rendering**: Utilizes D3.js to render all elements of the line chart and handle chart interactivity.
- **Utilities**: Helper functions and classes for common tasks, such as data formatting and event handling.
- **Services**: Abstractions for managing configurations and data processing, as well as SVG dimensions according to D3.js conventions.
- **Event Management**: Implements an event-driven architecture to facilitate communication between different parts of the component.
- **Types**: TypeScript interfaces and types to ensure type safety and improve code maintainability.

### 📁 Folder Structure

```txt
src/
├── events/           # Chart event emitter and event-related logic
├── renderers/        # Chart rendering modules with D3.js (axes, grid, series, legend, cursor, brush, etc.)
├── services/         # Chart services (data, configuration, svg dimensions, etc.)
├── types/            # TypeScript type definitions and interfaces
├── utils/            # Utility functions and helpers
├── d3-line-viz.ts    # Main chart factory function
├── line-viz.ts       # Chart web component definition
├── index.ts          # Main module entry point of the package
```

## Development Decisions

### d3-line-viz.ts

The `d3-line-viz.ts` module centers around the `createLineVizChart` builder function, which is designed to provide a flexible, modular, and maintainable way to construct D3.js line charts. This function implements the builder pattern, enabling users to configure the chart through a fluent, chainable API. Each configuration method (such as `.xSerie()`, `.series()`, `.data()`, etc.) updates the internal chart context and returns the chart instance, allowing for expressive and readable chart setup.

At the core of this design is the `ChartContext` object, which acts as a centralized container for all chart state, configuration, and runtime values. By maintaining all relevant information in this context, the chart rendering and interaction logic can be cleanly separated into dedicated modules. Each rendering or interaction function receives the context as an argument, ensuring that state is never duplicated or hidden in closures, and making the codebase easier to test, extend, and debug.

The decision to use a builder function with a context pattern was made to address several goals:

- **Configurability**: Users can set up the chart in a declarative, chainable manner, specifying only the options they need.
- **Separation of Concerns**: Rendering, data processing, and configuration logic are decoupled, with each concern handled in its own module or service.
- **Extensibility**: New features or configuration options can be added to the builder without breaking existing usage patterns.
- **State Management**: All chart state is explicit and accessible, reducing bugs related to hidden or implicit state.

To further support modularity and single responsibility, the module relies on services from the `services/` folder:

- `ConfigurationManager` provides default chart settings and configuration utilities.
- `DataService` handles data domain calculations and data-related logic.
- `ChartDimensions` abstracts SVG sizing, margins, and coordinate calculations.

By delegating these responsibilities to specialized services, the builder function remains focused on orchestrating chart construction, while the underlying logic for configuration, data, and layout is encapsulated and reusable. This architecture results in a robust, maintainable, and user-friendly charting package.

#### Pseudo Code

The following pseudo code outlines the structure and flow of the `createLineVizChart` function of the `d3-line-viz.ts` module:

```ts
const createLineVizChart = () => {
	// 1. Get default configuration from ConfigurationManager
	// 2. Initialize a context object to hold all chart state and config
	// 3. Define a chart function that:
	//    a. Validates setup
	//    b. Calculates dimensions using ChartDimensions
	//    c. Computes x/y domains using DataService
	//    d. Sets up D3 scales and stores them in context
	//    e. Calls rendering functions (axes, grid, series, legend, etc.)
	//    f. Sets up interactions (brush, cursor)
	// 4. Attach builder methods (xSerie, series, data, colorScale, etc.)
	//    Each updates context and returns the chart instance
	// 5. Return the chart function as the builder instance
	// 3. Define a chart function that:
	//    a. Validates setup
	//    b. Calculates dimensions using ChartDimensions
	//    c. Computes x/y domains using DataService
	//    d. Sets up D3 scales and stores them in context
	//    e. Calls rendering functions (axes, grid, series, legend, etc.)
	//    f. Sets up interactions (brush, cursor)
	// 4. Attach builder methods (xSerie, series, data, colorScale, etc.)
	//    Each updates context and returns the chart instance
	// 5. Return the chart function as the builder instance
}
```
