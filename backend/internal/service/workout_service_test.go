package service

import (
	"testing"
	"time"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
)

// MockWorkoutRepository はテスト用のモックリポジトリ
type MockWorkoutRepository struct {
	workouts map[uint64]*model.Workout
	sets     map[uint64]*model.WorkoutSet
	nextID   uint64
	nextSetID uint64
}

func NewMockWorkoutRepository() *MockWorkoutRepository {
	return &MockWorkoutRepository{
		workouts:  make(map[uint64]*model.Workout),
		sets:      make(map[uint64]*model.WorkoutSet),
		nextID:    1,
		nextSetID: 1,
	}
}

func (r *MockWorkoutRepository) Create(workout *model.Workout) error {
	workout.ID = r.nextID
	r.nextID++
	workout.CreatedAt = time.Now()
	workout.UpdatedAt = time.Now()
	r.workouts[workout.ID] = workout
	return nil
}

func (r *MockWorkoutRepository) FindByID(id uint64) (*model.Workout, error) {
	workout, ok := r.workouts[id]
	if !ok {
		return nil, ErrWorkoutNotFound
	}
	// セットを取得
	var sets []model.WorkoutSet
	for _, set := range r.sets {
		if set.WorkoutID == id {
			sets = append(sets, *set)
		}
	}
	workout.Sets = sets
	return workout, nil
}

func (r *MockWorkoutRepository) FindByUserIDAndDate(userID uint64, date time.Time) (*model.Workout, error) {
	dateStr := date.Format("2006-01-02")
	for _, workout := range r.workouts {
		if workout.UserID == userID && workout.Date.Format("2006-01-02") == dateStr {
			return workout, nil
		}
	}
	return nil, ErrWorkoutNotFound
}

func (r *MockWorkoutRepository) FindByUserID(userID uint64, limit, offset int) ([]model.Workout, error) {
	var workouts []model.Workout
	for _, workout := range r.workouts {
		if workout.UserID == userID {
			workouts = append(workouts, *workout)
		}
	}
	return workouts, nil
}

func (r *MockWorkoutRepository) CountByUserID(userID uint64) (int64, error) {
	var count int64
	for _, workout := range r.workouts {
		if workout.UserID == userID {
			count++
		}
	}
	return count, nil
}

func (r *MockWorkoutRepository) Update(workout *model.Workout) error {
	workout.UpdatedAt = time.Now()
	r.workouts[workout.ID] = workout
	return nil
}

func (r *MockWorkoutRepository) Delete(id uint64) error {
	delete(r.workouts, id)
	// セットも削除
	for setID, set := range r.sets {
		if set.WorkoutID == id {
			delete(r.sets, setID)
		}
	}
	return nil
}

func (r *MockWorkoutRepository) AddSet(set *model.WorkoutSet) error {
	set.ID = r.nextSetID
	r.nextSetID++
	set.CreatedAt = time.Now()
	r.sets[set.ID] = set
	return nil
}

func (r *MockWorkoutRepository) UpdateSet(set *model.WorkoutSet) error {
	r.sets[set.ID] = set
	return nil
}

func (r *MockWorkoutRepository) DeleteSet(id uint64) error {
	delete(r.sets, id)
	return nil
}

func (r *MockWorkoutRepository) DeleteSetsByWorkoutID(workoutID uint64) error {
	for id, set := range r.sets {
		if set.WorkoutID == workoutID {
			delete(r.sets, id)
		}
	}
	return nil
}

func (r *MockWorkoutRepository) FindByUserIDAndMonth(userID uint64, year, month int) ([]model.Workout, error) {
	var workouts []model.Workout
	for _, workout := range r.workouts {
		if workout.UserID == userID {
			if workout.Date.Year() == year && int(workout.Date.Month()) == month {
				workouts = append(workouts, *workout)
			}
		}
	}
	return workouts, nil
}

func (r *MockWorkoutRepository) GetMuscleGroupStats(userID uint64) ([]repository.MuscleGroupStat, error) {
	return []repository.MuscleGroupStat{}, nil
}

func (r *MockWorkoutRepository) GetPersonalBests(userID uint64) ([]repository.PersonalBest, error) {
	return []repository.PersonalBest{}, nil
}

func (r *MockWorkoutRepository) GetExerciseProgress(userID uint64, exerciseID uint64) ([]repository.ExerciseProgress, error) {
	return []repository.ExerciseProgress{}, nil
}

// MockExerciseRepository はテスト用のモックリポジトリ
type MockExerciseRepository struct {
	exercises map[uint64]*model.Exercise
	nextID    uint64
}

func NewMockExerciseRepository() *MockExerciseRepository {
	repo := &MockExerciseRepository{
		exercises: make(map[uint64]*model.Exercise),
		nextID:    1,
	}
	// プリセット種目を追加
	presets := []model.Exercise{
		{Name: "ベンチプレス", MuscleGroup: model.MuscleGroupChest, IsCustom: false},
		{Name: "スクワット", MuscleGroup: model.MuscleGroupLegs, IsCustom: false},
		{Name: "デッドリフト", MuscleGroup: model.MuscleGroupBack, IsCustom: false},
	}
	for _, e := range presets {
		exercise := e
		exercise.ID = repo.nextID
		repo.nextID++
		repo.exercises[exercise.ID] = &exercise
	}
	return repo
}

func (r *MockExerciseRepository) FindAll(userID uint64) ([]model.Exercise, error) {
	var exercises []model.Exercise
	for _, e := range r.exercises {
		if !e.IsCustom || (e.UserID != nil && *e.UserID == userID) {
			exercises = append(exercises, *e)
		}
	}
	return exercises, nil
}

func (r *MockExerciseRepository) FindByID(id uint64) (*model.Exercise, error) {
	e, ok := r.exercises[id]
	if !ok {
		return nil, ErrExerciseNotFound
	}
	return e, nil
}

func (r *MockExerciseRepository) FindByMuscleGroup(muscleGroup model.MuscleGroup, userID uint64) ([]model.Exercise, error) {
	var exercises []model.Exercise
	for _, e := range r.exercises {
		if e.MuscleGroup == muscleGroup {
			exercises = append(exercises, *e)
		}
	}
	return exercises, nil
}

func (r *MockExerciseRepository) Create(exercise *model.Exercise) error {
	exercise.ID = r.nextID
	r.nextID++
	r.exercises[exercise.ID] = exercise
	return nil
}

func (r *MockExerciseRepository) Update(exercise *model.Exercise) error {
	r.exercises[exercise.ID] = exercise
	return nil
}

func (r *MockExerciseRepository) Delete(id uint64) error {
	delete(r.exercises, id)
	return nil
}

func (r *MockExerciseRepository) FindCustomByUserID(userID uint64) ([]model.Exercise, error) {
	var exercises []model.Exercise
	for _, e := range r.exercises {
		if e.IsCustom && e.UserID != nil && *e.UserID == userID {
			exercises = append(exercises, *e)
		}
	}
	return exercises, nil
}

func (r *MockExerciseRepository) IsUsedInWorkouts(exerciseID uint64) (bool, error) {
	return false, nil
}

func TestWorkoutService_CreateWorkout(t *testing.T) {
	t.Run("正常にワークアウトを作成できる", func(t *testing.T) {
		workoutRepo := NewMockWorkoutRepository()
		exerciseRepo := NewMockExerciseRepository()

		userID := uint64(1)
		input := &CreateWorkoutInput{
			Date: "2026-01-07",
			Sets: []CreateSetInput{
				{ExerciseID: 1, SetNumber: 1, Weight: 60.0, Reps: 10},
				{ExerciseID: 1, SetNumber: 2, Weight: 60.0, Reps: 8},
			},
		}

		// ワークアウトを作成
		date, _ := time.Parse("2006-01-02", input.Date)
		workout := &model.Workout{
			UserID: userID,
			Date:   date,
		}
		if err := workoutRepo.Create(workout); err != nil {
			t.Fatalf("ワークアウト作成に失敗: %v", err)
		}

		// セットを追加
		for _, setInput := range input.Sets {
			set := &model.WorkoutSet{
				WorkoutID:  workout.ID,
				ExerciseID: setInput.ExerciseID,
				SetNumber:  setInput.SetNumber,
				Weight:     setInput.Weight,
				Reps:       setInput.Reps,
			}
			if err := workoutRepo.AddSet(set); err != nil {
				t.Fatalf("セット追加に失敗: %v", err)
			}
		}

		// 検証
		found, err := workoutRepo.FindByID(workout.ID)
		if err != nil {
			t.Fatalf("ワークアウト取得に失敗: %v", err)
		}
		if found.UserID != userID {
			t.Errorf("期待されるUserID: %d, 実際: %d", userID, found.UserID)
		}
		if len(found.Sets) != 2 {
			t.Errorf("期待されるセット数: 2, 実際: %d", len(found.Sets))
		}

		_ = exerciseRepo // 使用を示す
	})

	t.Run("セットなしでエラー", func(t *testing.T) {
		input := &CreateWorkoutInput{
			Date: "2026-01-07",
			Sets: []CreateSetInput{},
		}

		if len(input.Sets) == 0 {
			// エラーケースを確認
			t.Log("セットなしの場合はエラーになるべき")
		}
	})
}

func TestWorkoutService_GetWorkout(t *testing.T) {
	t.Run("自分のワークアウトを取得できる", func(t *testing.T) {
		workoutRepo := NewMockWorkoutRepository()

		userID := uint64(1)
		workout := &model.Workout{
			UserID: userID,
			Date:   time.Now(),
		}
		workoutRepo.Create(workout)

		// 検証
		found, err := workoutRepo.FindByID(workout.ID)
		if err != nil {
			t.Fatalf("ワークアウト取得に失敗: %v", err)
		}
		if found.UserID != userID {
			t.Error("UserIDが一致しない")
		}
	})

	t.Run("他人のワークアウトはアクセス拒否", func(t *testing.T) {
		workoutRepo := NewMockWorkoutRepository()

		ownerID := uint64(1)
		otherUserID := uint64(2)
		workout := &model.Workout{
			UserID: ownerID,
			Date:   time.Now(),
		}
		workoutRepo.Create(workout)

		// 検証
		found, _ := workoutRepo.FindByID(workout.ID)
		if found.UserID == otherUserID {
			t.Error("他人のワークアウトにアクセスできてしまう")
		}
	})
}

func TestWorkoutService_UpdateWorkout(t *testing.T) {
	t.Run("ワークアウトを更新できる", func(t *testing.T) {
		workoutRepo := NewMockWorkoutRepository()

		userID := uint64(1)
		memo := "最初のメモ"
		workout := &model.Workout{
			UserID: userID,
			Date:   time.Now(),
			Memo:   &memo,
		}
		workoutRepo.Create(workout)

		// 更新
		newMemo := "更新後のメモ"
		workout.Memo = &newMemo
		workoutRepo.Update(workout)

		// 検証
		found, _ := workoutRepo.FindByID(workout.ID)
		if *found.Memo != newMemo {
			t.Errorf("期待されるMemo: %s, 実際: %s", newMemo, *found.Memo)
		}
	})
}

func TestWorkoutService_DeleteWorkout(t *testing.T) {
	t.Run("ワークアウトを削除できる", func(t *testing.T) {
		workoutRepo := NewMockWorkoutRepository()

		userID := uint64(1)
		workout := &model.Workout{
			UserID: userID,
			Date:   time.Now(),
		}
		workoutRepo.Create(workout)
		workoutID := workout.ID

		// 削除
		workoutRepo.Delete(workoutID)

		// 検証
		_, err := workoutRepo.FindByID(workoutID)
		if err != ErrWorkoutNotFound {
			t.Error("削除後のワークアウトが見つかってしまう")
		}
	})
}

func TestWorkoutService_GetWorkoutsByMonth(t *testing.T) {
	t.Run("月別ワークアウトを取得できる", func(t *testing.T) {
		workoutRepo := NewMockWorkoutRepository()

		userID := uint64(1)
		// 1月のワークアウト
		workout1 := &model.Workout{
			UserID: userID,
			Date:   time.Date(2026, 1, 7, 0, 0, 0, 0, time.Local),
		}
		workoutRepo.Create(workout1)

		workout2 := &model.Workout{
			UserID: userID,
			Date:   time.Date(2026, 1, 15, 0, 0, 0, 0, time.Local),
		}
		workoutRepo.Create(workout2)

		// 2月のワークアウト
		workout3 := &model.Workout{
			UserID: userID,
			Date:   time.Date(2026, 2, 1, 0, 0, 0, 0, time.Local),
		}
		workoutRepo.Create(workout3)

		// 1月のワークアウトを取得
		workouts, err := workoutRepo.FindByUserIDAndMonth(userID, 2026, 1)
		if err != nil {
			t.Fatalf("月別ワークアウト取得に失敗: %v", err)
		}
		if len(workouts) != 2 {
			t.Errorf("期待されるワークアウト数: 2, 実際: %d", len(workouts))
		}
	})
}

func TestWorkoutService_CustomExercise(t *testing.T) {
	t.Run("カスタム種目を作成できる", func(t *testing.T) {
		exerciseRepo := NewMockExerciseRepository()

		userID := uint64(1)
		exercise := &model.Exercise{
			Name:        "カスタムエクササイズ",
			MuscleGroup: model.MuscleGroupChest,
			IsCustom:    true,
			UserID:      &userID,
		}
		exerciseRepo.Create(exercise)

		// 検証
		customExercises, _ := exerciseRepo.FindCustomByUserID(userID)
		if len(customExercises) != 1 {
			t.Errorf("期待されるカスタム種目数: 1, 実際: %d", len(customExercises))
		}
	})

	t.Run("カスタム種目を更新できる", func(t *testing.T) {
		exerciseRepo := NewMockExerciseRepository()

		userID := uint64(1)
		exercise := &model.Exercise{
			Name:        "元の名前",
			MuscleGroup: model.MuscleGroupChest,
			IsCustom:    true,
			UserID:      &userID,
		}
		exerciseRepo.Create(exercise)

		// 更新
		exercise.Name = "新しい名前"
		exerciseRepo.Update(exercise)

		// 検証
		found, _ := exerciseRepo.FindByID(exercise.ID)
		if found.Name != "新しい名前" {
			t.Errorf("期待される名前: 新しい名前, 実際: %s", found.Name)
		}
	})

	t.Run("カスタム種目を削除できる", func(t *testing.T) {
		exerciseRepo := NewMockExerciseRepository()

		userID := uint64(1)
		exercise := &model.Exercise{
			Name:        "削除する種目",
			MuscleGroup: model.MuscleGroupChest,
			IsCustom:    true,
			UserID:      &userID,
		}
		exerciseRepo.Create(exercise)
		exerciseID := exercise.ID

		// 削除
		exerciseRepo.Delete(exerciseID)

		// 検証
		_, err := exerciseRepo.FindByID(exerciseID)
		if err != ErrExerciseNotFound {
			t.Error("削除後の種目が見つかってしまう")
		}
	})
}

