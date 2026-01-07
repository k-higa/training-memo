CREATE TABLE IF NOT EXISTS workout_sets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workout_id BIGINT UNSIGNED NOT NULL,
    exercise_id BIGINT UNSIGNED NOT NULL,
    set_number TINYINT UNSIGNED NOT NULL,
    weight DECIMAL(6,2) NOT NULL COMMENT '重量(kg)',
    reps SMALLINT UNSIGNED NOT NULL COMMENT '回数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT,
    INDEX idx_workout_sets_workout_id (workout_id),
    INDEX idx_workout_sets_exercise_id (exercise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

