package database

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"antistudio/internal/core/agent"

	"github.com/google/uuid"
)

func TestNewSQLiteRepository(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	if repo == nil {
		t.Fatal("Repository should not be nil")
	}

	// Verify database file was created
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		t.Error("Database file should be created")
	}
}

func TestSQLiteRepository_CreateAndGetConversation(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create a conversation
	conv := &agent.Conversation{
		ID:        uuid.New().String(),
		Title:     "Test Conversation",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
		Metadata:  `{"model":"gpt-4"}`,
	}

	err = repo.Create(conv)
	if err != nil {
		t.Fatalf("Failed to create conversation: %v", err)
	}

	// Get the conversation
	retrieved, err := repo.Get(conv.ID)
	if err != nil {
		t.Fatalf("Failed to get conversation: %v", err)
	}

	if retrieved == nil {
		t.Fatal("Retrieved conversation should not be nil")
	}

	if retrieved.ID != conv.ID {
		t.Errorf("Expected ID '%s', got '%s'", conv.ID, retrieved.ID)
	}

	if retrieved.Title != conv.Title {
		t.Errorf("Expected title '%s', got '%s'", conv.Title, retrieved.Title)
	}
}

func TestSQLiteRepository_GetNonExistent(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	conv, err := repo.Get("non-existent-id")
	if err != nil {
		t.Fatalf("Get should not return error for non-existent: %v", err)
	}

	if conv != nil {
		t.Error("Get should return nil for non-existent conversation")
	}
}

func TestSQLiteRepository_ListConversations(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create multiple conversations
	for i := 0; i < 5; i++ {
		conv := &agent.Conversation{
			ID:        uuid.New().String(),
			Title:     "Test Conversation " + string(rune('A'+i)),
			CreatedAt: time.Now().Add(time.Duration(i) * time.Second).Unix(),
			UpdatedAt: time.Now().Unix(),
		}
		if err := repo.Create(conv); err != nil {
			t.Fatalf("Failed to create conversation: %v", err)
		}
	}

	// List with limit
	convs, err := repo.List(3, 0)
	if err != nil {
		t.Fatalf("Failed to list conversations: %v", err)
	}

	if len(convs) != 3 {
		t.Errorf("Expected 3 conversations, got %d", len(convs))
	}

	// List all
	allConvs, err := repo.List(10, 0)
	if err != nil {
		t.Fatalf("Failed to list all conversations: %v", err)
	}

	if len(allConvs) != 5 {
		t.Errorf("Expected 5 conversations, got %d", len(allConvs))
	}

	// Verify order (should be descending by created_at)
	for i := 0; i < len(allConvs)-1; i++ {
		if allConvs[i].CreatedAt < allConvs[i+1].CreatedAt {
			t.Error("Conversations should be ordered by created_at descending")
		}
	}
}

func TestSQLiteRepository_UpdateConversation(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create a conversation
	conv := &agent.Conversation{
		ID:        uuid.New().String(),
		Title:     "Original Title",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	if err := repo.Create(conv); err != nil {
		t.Fatalf("Failed to create conversation: %v", err)
	}

	// Update the conversation
	conv.Title = "Updated Title"
	conv.UpdatedAt = time.Now().Unix()

	if err := repo.Update(conv); err != nil {
		t.Fatalf("Failed to update conversation: %v", err)
	}

	// Retrieve and verify
	updated, err := repo.Get(conv.ID)
	if err != nil {
		t.Fatalf("Failed to get updated conversation: %v", err)
	}

	if updated.Title != "Updated Title" {
		t.Errorf("Expected title 'Updated Title', got '%s'", updated.Title)
	}
}

func TestSQLiteRepository_DeleteConversation(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create a conversation
	conv := &agent.Conversation{
		ID:        uuid.New().String(),
		Title:     "To Be Deleted",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	if err := repo.Create(conv); err != nil {
		t.Fatalf("Failed to create conversation: %v", err)
	}

	// Delete the conversation
	if err := repo.Delete(conv.ID); err != nil {
		t.Fatalf("Failed to delete conversation: %v", err)
	}

	// Verify it's deleted (soft delete with xorm)
	deleted, err := repo.Get(conv.ID)
	if err != nil {
		t.Fatalf("Failed to get deleted conversation: %v", err)
	}

	// With soft delete, it might still be retrievable but marked as deleted
	// Or it might return nil - both are acceptable
	if deleted != nil && deleted.DeletedAt == 0 {
		t.Error("Conversation should be marked as deleted")
	}
}

func TestSQLiteRepository_SaveAndGetMessages(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create a conversation first
	convID := uuid.New().String()
	conv := &agent.Conversation{
		ID:        convID,
		Title:     "Test Conversation",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	if err := repo.Create(conv); err != nil {
		t.Fatalf("Failed to create conversation: %v", err)
	}

	// Save multiple messages
	messages := []agent.Message{
		{
			ID:             uuid.New().String(),
			ConversationID: convID,
			Role:           agent.RoleUser,
			Content:        "Hello",
			CreatedAt:      time.Now().Unix(),
		},
		{
			ID:             uuid.New().String(),
			ConversationID: convID,
			Role:           agent.RoleAssistant,
			Content:        "Hi there!",
			CreatedAt:      time.Now().Add(1 * time.Second).Unix(),
		},
		{
			ID:             uuid.New().String(),
			ConversationID: convID,
			Role:           agent.RoleUser,
			Content:        "How are you?",
			CreatedAt:      time.Now().Add(2 * time.Second).Unix(),
		},
	}

	for _, msg := range messages {
		if err := repo.SaveMessage(&msg); err != nil {
			t.Fatalf("Failed to save message: %v", err)
		}
	}

	// Retrieve messages
	retrieved, err := repo.GetMessages(convID, 10)
	if err != nil {
		t.Fatalf("Failed to get messages: %v", err)
	}

	if len(retrieved) != 3 {
		t.Errorf("Expected 3 messages, got %d", len(retrieved))
	}

	// Verify order (should be ascending by created_at after reverse)
	for i := 0; i < len(retrieved)-1; i++ {
		if retrieved[i].CreatedAt > retrieved[i+1].CreatedAt {
			t.Error("Messages should be ordered by created_at ascending")
		}
	}

	// Verify content
	if retrieved[0].Content != "Hello" {
		t.Errorf("Expected first message 'Hello', got '%s'", retrieved[0].Content)
	}

	if retrieved[1].Content != "Hi there!" {
		t.Errorf("Expected second message 'Hi there!', got '%s'", retrieved[1].Content)
	}
}

func TestSQLiteRepository_GetMessagesWithLimit(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create conversation
	convID := uuid.New().String()
	conv := &agent.Conversation{
		ID:        convID,
		Title:     "Test",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}
	repo.Create(conv)

	// Save 10 messages
	for i := 0; i < 10; i++ {
		msg := agent.Message{
			ID:             uuid.New().String(),
			ConversationID: convID,
			Role:           agent.RoleUser,
			Content:        "Message " + string(rune('0'+i)),
			CreatedAt:      time.Now().Add(time.Duration(i) * time.Second).Unix(),
		}
		if err := repo.SaveMessage(&msg); err != nil {
			t.Fatalf("Failed to save message: %v", err)
		}
	}

	// Get last 5 messages
	messages, err := repo.GetMessages(convID, 5)
	if err != nil {
		t.Fatalf("Failed to get messages: %v", err)
	}

	if len(messages) != 5 {
		t.Errorf("Expected 5 messages, got %d", len(messages))
	}

	// Should get the latest 5 messages (5-9)
	if messages[0].Content != "Message 5" {
		t.Errorf("Expected 'Message 5', got '%s'", messages[0].Content)
	}

	if messages[4].Content != "Message 9" {
		t.Errorf("Expected 'Message 9', got '%s'", messages[4].Content)
	}
}

func TestSQLiteRepository_MessageTokenCounting(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	convID := uuid.New().String()
	conv := &agent.Conversation{
		ID:        convID,
		Title:     "Test",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}
	repo.Create(conv)

	// Save message with token counts
	msg := agent.Message{
		ID:               uuid.New().String(),
		ConversationID:   convID,
		Role:             agent.RoleAssistant,
		Content:          "Response",
		PromptTokens:     100,
		CompletionTokens: 50,
		CreatedAt:        time.Now().Unix(),
	}

	if err := repo.SaveMessage(&msg); err != nil {
		t.Fatalf("Failed to save message: %v", err)
	}

	// Retrieve and verify token counts
	messages, err := repo.GetMessages(convID, 10)
	if err != nil {
		t.Fatalf("Failed to get messages: %v", err)
	}

	if len(messages) != 1 {
		t.Fatalf("Expected 1 message, got %d", len(messages))
	}

	if messages[0].PromptTokens != 100 {
		t.Errorf("Expected 100 prompt tokens, got %d", messages[0].PromptTokens)
	}

	if messages[0].CompletionTokens != 50 {
		t.Errorf("Expected 50 completion tokens, got %d", messages[0].CompletionTokens)
	}
}

func TestSQLiteRepository_MessageThinking(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	convID := uuid.New().String()
	conv := &agent.Conversation{
		ID:        convID,
		Title:     "Test",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}
	repo.Create(conv)

	// Save message with thinking
	msg := agent.Message{
		ID:             uuid.New().String(),
		ConversationID: convID,
		Role:           agent.RoleAssistant,
		Content:        "The answer is 42",
		Thinking:       "Let me analyze this step by step...",
		CreatedAt:      time.Now().Unix(),
	}

	if err := repo.SaveMessage(&msg); err != nil {
		t.Fatalf("Failed to save message: %v", err)
	}

	// Retrieve and verify thinking
	messages, err := repo.GetMessages(convID, 10)
	if err != nil {
		t.Fatalf("Failed to get messages: %v", err)
	}

	if len(messages) != 1 {
		t.Fatalf("Expected 1 message, got %d", len(messages))
	}

	if messages[0].Thinking != "Let me analyze this step by step..." {
		t.Errorf("Expected thinking content, got '%s'", messages[0].Thinking)
	}
}

// Benchmark tests
func BenchmarkSQLiteRepository_Create(b *testing.B) {
	tmpDir := b.TempDir()
	dbPath := filepath.Join(tmpDir, "bench.db")

	repo, _ := NewSQLiteRepository(dbPath)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		conv := &agent.Conversation{
			ID:        uuid.New().String(),
			Title:     "Benchmark Conversation",
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
		}
		repo.Create(conv)
	}
}

func BenchmarkSQLiteRepository_Get(b *testing.B) {
	tmpDir := b.TempDir()
	dbPath := filepath.Join(tmpDir, "bench.db")

	repo, _ := NewSQLiteRepository(dbPath)

	// Create a conversation
	convID := uuid.New().String()
	conv := &agent.Conversation{
		ID:        convID,
		Title:     "Benchmark",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}
	repo.Create(conv)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		repo.Get(convID)
	}
}
