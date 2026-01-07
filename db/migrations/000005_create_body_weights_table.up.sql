CREATE TABLE IF NOT EXISTS body_weights (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL COMMENT '体重(kg)',
    body_fat_percentage DECIMAL(4,1) NULL COMMENT '体脂肪率(%)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_body_weights_user_date (user_id, date),
    UNIQUE KEY uk_body_weights_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

