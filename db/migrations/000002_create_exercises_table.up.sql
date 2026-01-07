CREATE TABLE IF NOT EXISTS exercises (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    muscle_group ENUM('chest', 'back', 'shoulders', 'arms', 'legs', 'abs', 'other') NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_exercises_muscle_group (muscle_group),
    INDEX idx_exercises_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- プリセット種目の挿入
INSERT INTO exercises (name, muscle_group, is_custom) VALUES
-- 胸
('ベンチプレス', 'chest', FALSE),
('インクラインベンチプレス', 'chest', FALSE),
('ダンベルフライ', 'chest', FALSE),
('チェストプレス', 'chest', FALSE),
('プッシュアップ', 'chest', FALSE),
-- 背中
('デッドリフト', 'back', FALSE),
('ラットプルダウン', 'back', FALSE),
('ベントオーバーロー', 'back', FALSE),
('シーテッドロー', 'back', FALSE),
('チンニング', 'back', FALSE),
-- 肩
('ショルダープレス', 'shoulders', FALSE),
('サイドレイズ', 'shoulders', FALSE),
('フロントレイズ', 'shoulders', FALSE),
('リアレイズ', 'shoulders', FALSE),
('アップライトロー', 'shoulders', FALSE),
-- 腕
('バーベルカール', 'arms', FALSE),
('ダンベルカール', 'arms', FALSE),
('トライセプスエクステンション', 'arms', FALSE),
('ケーブルプッシュダウン', 'arms', FALSE),
('ハンマーカール', 'arms', FALSE),
-- 脚
('スクワット', 'legs', FALSE),
('レッグプレス', 'legs', FALSE),
('レッグエクステンション', 'legs', FALSE),
('レッグカール', 'legs', FALSE),
('カーフレイズ', 'legs', FALSE),
('ランジ', 'legs', FALSE),
-- 腹筋
('クランチ', 'abs', FALSE),
('レッグレイズ', 'abs', FALSE),
('プランク', 'abs', FALSE),
('アブローラー', 'abs', FALSE);

