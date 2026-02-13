package app_test

import (
	"context"
	"testing"
	"time"

	"antistudio/internal/app"
	"antistudio/internal/core/agent"
	"antistudio/internal/core/port"
	"antistudio/internal/infra/llm"
	"antistudio/internal/service"
)

// Mock implementations for testing
type MockRepo struct {
	conversations map[string]*agent.Conversation
	messages      map[string][]*agent.Message
}

func NewMockRepo() *MockRepo {
	return &MockRepo{
		conversations: make(map[string]*agent.Conversation),
		messages:      make(map[string][]*agent.Message),
	}
}

func (m *MockRepo) Create(conv *agent.Conversation) error {
	m.conversations[conv.ID] = conv
	return nil
}

func (m *MockRepo) Get(id string) (*agent.Conversation, error) {
	return m.conversations[id], nil
}

func (m *MockRepo) List(limit, offset int) ([]*agent.Conversation, error) {
	convs := make([]*agent.Conversation, 0, len(m.conversations))
	for _, c := range m.conversations {
		convs = append(convs, c)
	}
	if len(convs) > limit {
		convs = convs[:limit]
	}
	return convs, nil
}

func (m *MockRepo) Update(conv *agent.Conversation) error {
	m.conversations[conv.ID] = conv
	return nil
}

func (m *MockRepo) Delete(id string) error {
	delete(m.conversations, id)
	return nil
}

func (m *MockRepo) SaveMessage(msg *agent.Message) error {
	m.messages[msg.ConversationID] = append(m.messages[msg.ConversationID], msg)
	return nil
}

func (m *MockRepo) GetMessages(cid string, limit int) ([]*agent.Message, error) {
	return m.messages[cid], nil
}

type MockLLM struct {
	responses []port.StreamChunk
}

func (m *MockLLM) ID() string {
	return "mock-llm"
}

func (m *MockLLM) Chat(ctx context.Context, msgs []agent.Message, opts map[string]any) (*agent.Message, error) {
	return &agent.Message{
		Role:    agent.RoleAssistant,
		Content: "Mock response",
	}, nil
}

func (m *MockLLM) StreamChat(ctx context.Context, msgs []agent.Message, opts map[string]any) (<-chan port.StreamChunk, error) {
	ch := make(chan port.StreamChunk)
	go func() {
		defer close(ch)
		for _, chunk := range m.responses {
			ch <- chunk
			time.Sleep(10 * time.Millisecond)
		}
	}()
	return ch, nil
}

func newTestAPI(repo port.ConversationRepository, llmProvider port.LLMProvider) *app.AgentAPI {
	agentSvc := service.NewAgentService(repo, llmProvider)
	factory := llm.NewProviderFactory()
	return app.NewAgentAPI(agentSvc, factory)
}

func TestNewAgentAPI(t *testing.T) {
	repo := NewMockRepo()
	mockLLM := &MockLLM{
		responses: []port.StreamChunk{
			{ContentDelta: "Hello "},
			{ContentDelta: "World!"},
		},
	}

	// Create API
	api := newTestAPI(repo, mockLLM)

	if api == nil {
		t.Fatal("AgentAPI should not be nil")
	}
}

func TestAgentAPI_Chat(t *testing.T) {
	t.Skip("Skipping test that requires Wails runtime context")

	repo := NewMockRepo()
	llm := &MockLLM{
		responses: []port.StreamChunk{
			{ContentDelta: "Hello"},
		},
	}
	api := newTestAPI(repo, llm)

	ctx := context.Background()

	req := app.ChatRequest{
		SessionID: "test-session",
		Content:   "Hello",
	}

	// Chat should not block
	resp := api.Chat(ctx, req)
	if !resp.Success {
		t.Fatalf("Chat should succeed, got error: %s", resp.Error)
	}

	if resp.SessionID != "test-session" {
		t.Errorf("Expected session ID 'test-session', got '%s'", resp.SessionID)
	}

	// Give goroutine time to start
	time.Sleep(50 * time.Millisecond)
}

func TestAgentAPI_Chat_EmptyContent(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{}
	api := newTestAPI(repo, llm)

	ctx := context.Background()

	req := app.ChatRequest{
		SessionID: "test-session",
		Content:   "", // Empty content
	}

	resp := api.Chat(ctx, req)
	if resp.Success {
		t.Error("Chat with empty content should fail")
	}

	if resp.Error == "" {
		t.Error("Expected error message for empty content")
	}
}

func TestAgentAPI_Chat_GeneratesSessionID(t *testing.T) {
	t.Skip("Skipping test that requires Wails runtime context")

	repo := NewMockRepo()
	llm := &MockLLM{
		responses: []port.StreamChunk{
			{ContentDelta: "Hello"},
		},
	}
	api := newTestAPI(repo, llm)

	ctx := context.Background()

	req := app.ChatRequest{
		Content: "Hello", // No session ID
	}

	resp := api.Chat(ctx, req)
	if !resp.Success {
		t.Fatalf("Chat should succeed: %s", resp.Error)
	}

	if resp.SessionID == "" {
		t.Error("Expected generated session ID")
	}

	// Give goroutine time to start
	time.Sleep(50 * time.Millisecond)
}

func TestAgentAPI_ListSessions(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{}

	// Add test conversations
	repo.conversations["sess-1"] = &agent.Conversation{
		ID:        "sess-1",
		Title:     "Test Session 1",
		CreatedAt: time.Now().Unix(),
	}
	repo.conversations["sess-2"] = &agent.Conversation{
		ID:        "sess-2",
		Title:     "Test Session 2",
		CreatedAt: time.Now().Unix(),
	}

	api := newTestAPI(repo, llm)

	ctx := context.Background()
	resp := api.ListSessions(ctx, app.ListSessionsRequest{
		Limit:  10,
		Offset: 0,
	})

	if resp.Error != "" {
		t.Fatalf("ListSessions failed: %s", resp.Error)
	}

	if len(resp.Sessions) != 2 {
		t.Errorf("Expected 2 sessions, got %d", len(resp.Sessions))
	}

	if resp.Total != 2 {
		t.Errorf("Expected total 2, got %d", resp.Total)
	}
}

func TestAgentAPI_ListSessions_DefaultLimit(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{}
	api := newTestAPI(repo, llm)

	ctx := context.Background()
	resp := api.ListSessions(ctx, app.ListSessionsRequest{
		Limit: 0, // Should default to 50
	})

	if resp.Error != "" {
		t.Fatalf("ListSessions failed: %s", resp.Error)
	}

	// Should not crash with default limit
}

func TestAgentAPI_ListSessionsWithLimit(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{}

	// Add test conversations
	for i := 0; i < 5; i++ {
		id := "sess-" + string(rune('0'+i))
		repo.conversations[id] = &agent.Conversation{
			ID:        id,
			Title:     "Session " + string(rune('0'+i)),
			CreatedAt: time.Now().Unix(),
		}
	}

	api := newTestAPI(repo, llm)

	ctx := context.Background()
	resp := api.ListSessions(ctx, app.ListSessionsRequest{
		Limit:  3,
		Offset: 0,
	})

	if resp.Error != "" {
		t.Fatalf("ListSessions failed: %s", resp.Error)
	}

	// MockRepo limits results
	if len(resp.Sessions) > 3 {
		t.Errorf("Expected at most 3 sessions, got %d", len(resp.Sessions))
	}
}

// Benchmark tests
func BenchmarkAgentAPI_Chat(b *testing.B) {
	b.Skip("Skipping benchmark that requires Wails runtime context")
}

func BenchmarkAgentAPI_ListSessions(b *testing.B) {
	repo := NewMockRepo()
	llm := &MockLLM{}
	api := newTestAPI(repo, llm)

	ctx := context.Background()
	req := app.ListSessionsRequest{
		Limit:  10,
		Offset: 0,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		api.ListSessions(ctx, req)
	}
}
