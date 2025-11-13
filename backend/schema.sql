-- UBU AI Gateway Database Schema
-- Run this SQL to create the required tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    ubuaccount VARCHAR(50) UNIQUE NOT NULL,
    personcode VARCHAR(20),
    fullname VARCHAR(255) NOT NULL,
    faculty VARCHAR(255),
    department_name VARCHAR(255),
    email VARCHAR(255),
    position VARCHAR(255),
    level_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    spending_limit DECIMAL(10,2) DEFAULT 0,
    current_spend DECIMAL(10,2) DEFAULT 0,
    reset_type VARCHAR(20) DEFAULT 'NEVER' CHECK (reset_type IN ('NEVER', 'DAILY', 'WEEKLY', 'MONTHLY')),
    last_reset TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Usage Logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    request_id VARCHAR(255),
    cost DECIMAL(10,4) DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Sessions table (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_ubuaccount ON users(ubuaccount);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Insert default admin user (change password in production)
INSERT INTO users (ubuaccount, fullname, faculty, department_name, email, position, role, status)
VALUES ('admin', 'System Administrator', 'IT', 'System', 'admin@ubu.ac.th', 'Administrator', 'ADMIN', 'active')
ON CONFLICT (ubuaccount) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai;
