# Metrics Dashboard

A production-grade, real-time analytics dashboard for monitoring workflow executions, performance metrics, and service health.

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

## Database Schema

The dashboard uses the following Supabase tables:

- **workflows** - Workflow definitions with versioning
- **workflow_executions** - Execution records with status tracking
- **node_executions** - Individual node execution details
- **service_metrics** - Aggregated service performance data

## Auto-Refresh

The dashboard automatically refreshes every 30 seconds to provide real-time insights without manual intervention.

## Sample Data

Use the "Seed Sample Data" button to populate the dashboard with demonstration data including:
- 3 sample workflows (Customer Onboarding, Invoice Processing, Lead Qualification)
- 30 sample executions with varied statuses
- Service metrics for Email Service, Payment Gateway, and Data Validator

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

- Optimized database queries with proper indexing
- Efficient data fetching with parallel API calls
- Row Level Security (RLS) enabled on all tables
- Automatic caching and refresh mechanisms

## Navigation

Access the Metrics Dashboard from the sidebar using the "Metrics Dashboard" menu item with the BarChart icon.

## Technology Stack

- React 18 with TypeScript
- Supabase for database and real-time features
- Recharts for data visualization
- Framer Motion for animations
- Tailwind CSS for styling
- Lucide React for icons
- date-fns for date formatting
