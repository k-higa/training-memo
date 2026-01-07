CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    exercise_id BIGINT NOT NULL REFERENCES exercises(id),
    order_number SMALLINT NOT NULL,
    target_sets SMALLINT NOT NULL DEFAULT 3,
    target_reps SMALLINT NOT NULL DEFAULT 10,
    target_weight DECIMAL(6, 2),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
