CREATE TABLE IF NOT EXISTS body_weights (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    body_fat_percentage DECIMAL(4,1) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_body_weights_user_date ON body_weights(user_id, date);
