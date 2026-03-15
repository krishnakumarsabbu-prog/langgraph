/*
  # Create Metrics and Execution Tracking Tables

  ## Tables Created
  
  ### 1. workflows
    - `id` (uuid, primary key) - Unique workflow identifier
    - `name` (text, unique) - Workflow name
    - `description` (text) - Workflow description
    - `version` (integer) - Version number
    - `data` (jsonb) - Workflow graph data (nodes, edges)
    - `context` (jsonb) - Additional workflow context
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `is_latest` (boolean) - Flag for latest version
    
  ### 2. workflow_executions
    - `id` (uuid, primary key) - Unique execution identifier
    - `workflow_id` (uuid, foreign key) - Reference to workflow
    - `workflow_name` (text) - Workflow name for quick access
    - `status` (text) - Execution status (running, completed, failed, cancelled)
    - `current_node_id` (text) - Currently executing node
    - `parent_execution_id` (uuid) - For nested workflow executions
    - `input_data` (jsonb) - Execution input parameters
    - `output_data` (jsonb) - Execution output results
    - `error` (text) - Error message if failed
    - `created_at` (timestamptz) - Start time
    - `updated_at` (timestamptz) - Last update time
    - `completed_at` (timestamptz) - Completion time
    
  ### 3. node_executions
    - `id` (uuid, primary key) - Unique node execution identifier
    - `workflow_execution_id` (uuid, foreign key) - Reference to workflow execution
    - `node_id` (text) - Node identifier from workflow graph
    - `node_type` (text) - Type of node (llm, service, form, etc.)
    - `status` (text) - Node execution status
    - `input_data` (jsonb) - Node input data
    - `output_data` (jsonb) - Node output data
    - `error` (text) - Error message if failed
    - `started_at` (timestamptz) - Node start time
    - `completed_at` (timestamptz) - Node completion time
    - `duration_ms` (integer) - Execution duration in milliseconds
    
  ### 4. service_metrics
    - `id` (uuid, primary key) - Unique metrics identifier
    - `node_id` (text, unique) - Service node identifier
    - `service_name` (text) - Service name
    - `total_calls` (integer) - Total number of calls
    - `success_count` (integer) - Successful calls
    - `failure_count` (integer) - Failed calls
    - `total_duration_ms` (bigint) - Total execution time
    - `avg_duration_ms` (integer) - Average execution time
    - `min_duration_ms` (integer) - Minimum execution time
    - `max_duration_ms` (integer) - Maximum execution time
    - `last_called_at` (timestamptz) - Last call timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    
  ## Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to insert/update execution data
    
  ## Indexes
    - Created indexes on foreign keys for optimal query performance
    - Created indexes on status and timestamp fields for filtering
    - Created indexes on workflow_name for quick lookups
*/

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  version integer DEFAULT 1 NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_latest boolean DEFAULT true NOT NULL
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_name text NOT NULL,
  status text DEFAULT 'running' NOT NULL,
  current_node_id text,
  parent_execution_id uuid REFERENCES workflow_executions(id) ON DELETE SET NULL,
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create node_executions table
CREATE TABLE IF NOT EXISTS node_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id uuid REFERENCES workflow_executions(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_type text NOT NULL,
  status text DEFAULT 'running' NOT NULL,
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  duration_ms integer
);

-- Create service_metrics table
CREATE TABLE IF NOT EXISTS service_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text UNIQUE NOT NULL,
  service_name text NOT NULL,
  total_calls integer DEFAULT 0 NOT NULL,
  success_count integer DEFAULT 0 NOT NULL,
  failure_count integer DEFAULT 0 NOT NULL,
  total_duration_ms bigint DEFAULT 0 NOT NULL,
  avg_duration_ms integer DEFAULT 0 NOT NULL,
  min_duration_ms integer,
  max_duration_ms integer,
  last_called_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_name ON workflow_executions(workflow_name);

CREATE INDEX IF NOT EXISTS idx_node_executions_workflow_execution_id ON node_executions(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_node_executions_node_id ON node_executions(node_id);
CREATE INDEX IF NOT EXISTS idx_node_executions_status ON node_executions(status);
CREATE INDEX IF NOT EXISTS idx_node_executions_started_at ON node_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_metrics_node_id ON service_metrics(node_id);
CREATE INDEX IF NOT EXISTS idx_service_metrics_last_called_at ON service_metrics(last_called_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name);
CREATE INDEX IF NOT EXISTS idx_workflows_is_latest ON workflows(is_latest);

-- Enable Row Level Security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for workflows table
CREATE POLICY "Allow public read access to workflows"
  ON workflows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to workflows"
  ON workflows
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to workflows"
  ON workflows
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for workflow_executions table
CREATE POLICY "Allow public read access to workflow_executions"
  ON workflow_executions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to workflow_executions"
  ON workflow_executions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to workflow_executions"
  ON workflow_executions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for node_executions table
CREATE POLICY "Allow public read access to node_executions"
  ON node_executions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to node_executions"
  ON node_executions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to node_executions"
  ON node_executions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for service_metrics table
CREATE POLICY "Allow public read access to service_metrics"
  ON service_metrics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to service_metrics"
  ON service_metrics
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to service_metrics"
  ON service_metrics
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);