-- Database schema for Udhar Management (Khata Management)

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS udhar (
    udhar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    identity VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    CONSTRAINT amount_check CHECK (amount > 0),
    type VARCHAR(255) NOT NULL,
    CONSTRAINT type_check CHECK (type IN ('udhar', 'payment')),
    date DATE NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_udhar_user ON udhar (user_id);
CREATE INDEX IF NOT EXISTS idx_udhar_contact ON udhar (user_id, name, identity);
