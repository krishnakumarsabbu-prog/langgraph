# Metrics Dashboard

A production-grade, real-time analytics dashboard for monitoring workflow executions, performance metrics, and service health. **Now integrated with your backend API!**

## Features

### 1. **Real-Time Summary Cards**
- Total Executions count with all-time statistics
- Success Rate percentage with visual indicators
- Failed Executions tracking with running count
- Average Execution Time with workflow count

### 2. **Execution Trends Chart**
- 7-day execution trends visualization
- Area chart showing Total, Success, and Failed executions
- Color-coded gradients for easy interpretation
- Interactive tooltips with detailed information

### 3. **Workflow Performance Chart**
- Bar chart comparing success rates across workflows
- Color-coded bars (green: >90%, yellow: 70-89%, red: <70%)
- Execution count overlay for volume analysis
- Top 10 workflows displayed

### 4. **Service Metrics Panel**
- Real-time service performance monitoring
- Success rate, total calls, and average response time
- Min/Max duration tracking
- Success/Failure breakdown with visual indicators
- Last called timestamp for each service

### 5. **Workflow Versions Panel**
- Version history for all workflows
- Latest version highlighting
- Creation timestamps and version numbers
- Expandable view to see all versions
- Description and metadata display

### 6. **Execution History**
- Chronological list of recent executions
- Status badges (Completed, Failed, Running, Cancelled)
- Execution duration calculations
- Error message display for failed executions
- Expandable details with execution and workflow IDs
- Real-time status updates

## Backend API Integration

The dashboard integrates with your existing backend APIs:

### API Endpoints Used

- **GET /executions** - List workflow executions
- **GET /executions/{execution_id}** - Get execution details
- **GET /executions/{execution_id}/nodes** - Get node executions
- **GET /api/flows** - List all workflows
- **GET /api/flows/{name}/versions** - Get workflow versions
- **GET /metrics/service/all** - Get all service metrics
- **GET /metrics/service/{node_id}** - Get node-specific metrics

### Configuration

Set your backend API URL in the `.env` file:

```
VITE_BACKEND_API_URL=http://localhost:8000
```

The dashboard automatically connects to your backend and fetches real data.

## Auto-Refresh

The dashboard automatically refreshes every 30 seconds to provide real-time insights without manual intervention.

## Design Features

- **Gradient backgrounds** for visual appeal
- **Smooth animations** using Framer Motion
- **Responsive layout** adapting to all screen sizes
- **Dark mode support** with theme switching
- **Color-coded status indicators** for quick insights
- **Interactive hover states** throughout
- **Professional typography** and spacing
- **Chart visualizations** using Recharts library

## Performance

- Optimized API calls with proper error handling
- Efficient data fetching with parallel requests
- Graceful fallbacks when APIs are unavailable
- Automatic caching and refresh mechanisms

## Navigation

Access the Metrics Dashboard from the sidebar using the "Metrics Dashboard" menu item with the BarChart icon.

## Technology Stack

- React 18 with TypeScript
- Axios for API communication
- Recharts for data visualization
- Framer Motion for animations
- Tailwind CSS for styling
- Lucide React for icons
- date-fns for date formatting

## API Response Format

The dashboard expects the following response formats from your backend:

### Workflow Execution
```json
{
  "id": "uuid",
  "workflow_id": "uuid",
  "workflow_name": "string",
  "status": "completed|failed|running|cancelled",
  "created_at": "ISO datetime",
  "completed_at": "ISO datetime",
  "error": "string|null"
}
```

### Workflow
```json
{
  "id": "uuid",
  "name": "string",
  "version": 1,
  "data": {},
  "context": {},
  "created_at": "ISO datetime"
}
```

### Service Metrics
```json
{
  "id": "uuid",
  "node_id": "string",
  "service_name": "string",
  "total_calls": 0,
  "success_count": 0,
  "failure_count": 0,
  "avg_duration_ms": 0,
  "min_duration_ms": 0,
  "max_duration_ms": 0
}
```
