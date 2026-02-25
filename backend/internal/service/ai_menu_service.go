package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
)

// GenerateMenuInput はAIメニュー生成の入力パラメータ
type GenerateMenuInput struct {
	Goal               string   `json:"goal"`
	FitnessLevel       string   `json:"fitness_level"`
	DaysPerWeek        int      `json:"days_per_week"`
	DurationMinutes    int      `json:"duration_minutes"`
	TargetMuscleGroups []string `json:"target_muscle_groups,omitempty"`
	Notes              string   `json:"notes,omitempty"`
}

// GeneratedMenuItemOutput はAI生成メニューのアイテム（種目情報付き）
type GeneratedMenuItemOutput struct {
	ExerciseID   uint64          `json:"exercise_id"`
	OrderNumber  uint8           `json:"order_number"`
	TargetSets   uint8           `json:"target_sets"`
	TargetReps   uint16          `json:"target_reps"`
	TargetWeight *float64        `json:"target_weight,omitempty"`
	Note         *string         `json:"note,omitempty"`
	Exercise     *model.Exercise `json:"exercise,omitempty"`
}

// GenerateMenuOutput はAI生成メニューの出力
type GenerateMenuOutput struct {
	Name        string                    `json:"name"`
	Description string                    `json:"description"`
	Items       []GeneratedMenuItemOutput `json:"items"`
}

// OpenAI APIのリクエスト/レスポンス構造体
type openAIRequest struct {
	Model          string            `json:"model"`
	Messages       []openAIMessage   `json:"messages"`
	ResponseFormat map[string]string `json:"response_format"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// AIからのJSONレスポンス（パース用）
type aiMenuJSON struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Items       []aiMenuItemJSON `json:"items"`
}

type aiMenuItemJSON struct {
	ExerciseID   uint64   `json:"exercise_id"`
	OrderNumber  uint8    `json:"order_number"`
	TargetSets   uint8    `json:"target_sets"`
	TargetReps   uint16   `json:"target_reps"`
	TargetWeight *float64 `json:"target_weight"`
	Note         *string  `json:"note"`
}

type AIMenuService struct {
	exerciseRepo *repository.ExerciseRepository
}

func NewAIMenuService(exerciseRepo *repository.ExerciseRepository) *AIMenuService {
	return &AIMenuService{exerciseRepo: exerciseRepo}
}

func (s *AIMenuService) GenerateMenu(userID uint64, input *GenerateMenuInput) (*GenerateMenuOutput, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY が設定されていません")
	}

	// 種目リストを取得
	exercises, err := s.exerciseRepo.FindAll(userID)
	if err != nil {
		return nil, fmt.Errorf("種目の取得に失敗しました: %w", err)
	}

	// 種目マップ（IDをキー）を作成（後でバリデーションに使う）
	exerciseMap := make(map[uint64]*model.Exercise)
	for i := range exercises {
		exerciseMap[exercises[i].ID] = &exercises[i]
	}

	// プロンプト構築
	systemPrompt := s.buildSystemPrompt(exercises)
	userMessage := s.buildUserMessage(input)

	// OpenAI API呼び出し
	reqBody := openAIRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userMessage},
		},
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("リクエストの作成に失敗しました: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("HTTPリクエストの作成に失敗しました: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("OpenAI APIの呼び出しに失敗しました: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("レスポンスの読み取りに失敗しました: %w", err)
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(respBody, &openAIResp); err != nil {
		return nil, fmt.Errorf("OpenAIレスポンスのパースに失敗しました: %w", err)
	}

	if openAIResp.Error != nil {
		return nil, fmt.Errorf("OpenAI APIエラー: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("OpenAIからレスポンスが返りませんでした")
	}

	// AIのJSONをパース
	var aiMenu aiMenuJSON
	if err := json.Unmarshal([]byte(openAIResp.Choices[0].Message.Content), &aiMenu); err != nil {
		return nil, fmt.Errorf("AI生成メニューのパースに失敗しました: %w", err)
	}

	// exercise_idのバリデーションと種目情報の付与
	output := &GenerateMenuOutput{
		Name:        aiMenu.Name,
		Description: aiMenu.Description,
		Items:       make([]GeneratedMenuItemOutput, 0, len(aiMenu.Items)),
	}

	for _, item := range aiMenu.Items {
		exercise, ok := exerciseMap[item.ExerciseID]
		if !ok {
			// 不正なexercise_idはスキップ
			continue
		}
		output.Items = append(output.Items, GeneratedMenuItemOutput{
			ExerciseID:   item.ExerciseID,
			OrderNumber:  item.OrderNumber,
			TargetSets:   item.TargetSets,
			TargetReps:   item.TargetReps,
			TargetWeight: item.TargetWeight,
			Note:         item.Note,
			Exercise:     exercise,
		})
	}

	if len(output.Items) == 0 {
		return nil, fmt.Errorf("有効な種目が生成されませんでした")
	}

	return output, nil
}

func (s *AIMenuService) buildSystemPrompt(exercises []model.Exercise) string {
	muscleGroupLabel := map[string]string{
		"chest": "胸", "back": "背中", "shoulders": "肩",
		"arms": "腕", "legs": "脚", "abs": "腹筋", "other": "その他",
	}

	var sb strings.Builder
	sb.WriteString(`あなたはプロのパーソナルトレーナーです。ユーザーの情報に基づいて、最適なトレーニングメニューをJSON形式で作成してください。以下のルールを厳守してください：
1. 必ず下記の「利用可能な種目リスト」に記載されているexercise_idのみを使用すること
2. レスポンスは純粋なJSONオブジェクトのみ（コードブロックや説明文は不要）
3. 以下のJSON形式で返すこと：
{
  "name": "メニュー名（20文字以内）",
  "description": "メニューの説明（100文字以内）",
  "items": [
    {
      "exercise_id": 種目のID（整数）,
      "order_number": 順番（1から始まる整数）,
      "target_sets": セット数（1-5の整数）,
      "target_reps": レップ数（5-20の整数）,
      "target_weight": 目安重量kg（数値、不明な場合は省略）,
      "note": フォームのアドバイスなど（省略可能）
    }
  ]
}

利用可能な種目リスト（exercise_id: 種目名 (部位)）：
`)

	for _, e := range exercises {
		label := muscleGroupLabel[string(e.MuscleGroup)]
		sb.WriteString(fmt.Sprintf("- %d: %s (%s)\n", e.ID, e.Name, label))
	}

	return sb.String()
}

func (s *AIMenuService) buildUserMessage(input *GenerateMenuInput) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("トレーニング目標：%s\n", input.Goal))
	sb.WriteString(fmt.Sprintf("フィットネスレベル：%s\n", input.FitnessLevel))
	sb.WriteString(fmt.Sprintf("週のトレーニング回数：%d回\n", input.DaysPerWeek))
	sb.WriteString(fmt.Sprintf("1回のトレーニング時間：%d分\n", input.DurationMinutes))

	if len(input.TargetMuscleGroups) > 0 {
		sb.WriteString(fmt.Sprintf("重点部位：%s\n", strings.Join(input.TargetMuscleGroups, "、")))
	}

	if input.Notes != "" {
		sb.WriteString(fmt.Sprintf("その他の要望：%s\n", input.Notes))
	}

	return sb.String()
}
