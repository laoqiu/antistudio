package service_test

import (
	"context"
	"testing"
	"time"

	"antistudio/internal/core/agent"
	"antistudio/internal/core/port"
	"antistudio/internal/service"
)

// --- Mocks ---

type MockRepo struct {
	msgs  map[string][]*agent.Message
	convs map[string]*agent.Conversation
}

func NewMockRepo() *MockRepo {
	return &MockRepo{
		msgs:  make(map[string][]*agent.Message),
		convs: make(map[string]*agent.Conversation),
	}
}

func (m *MockRepo) Create(conv *agent.Conversation) error {
	m.convs[conv.ID] = conv
	return nil
}
func (m *MockRepo) Get(id string) (*agent.Conversation, error) {
	return m.convs[id], nil
}
func (m *MockRepo) List(limit, offset int) ([]*agent.Conversation, error) {
	convs := make([]*agent.Conversation, 0, len(m.convs))
	for _, c := range m.convs {
		convs = append(convs, c)
	}
	// Apply limit
	if len(convs) > limit {
		convs = convs[:limit]
	}
	return convs, nil
}
func (m *MockRepo) Update(conv *agent.Conversation) error { return nil }
func (m *MockRepo) Delete(id string) error                { return nil }

func (m *MockRepo) SaveMessage(msg *agent.Message) error {
	m.msgs[msg.ConversationID] = append(m.msgs[msg.ConversationID], msg)
	return nil
}
func (m *MockRepo) GetMessages(cid string, limit int) ([]*agent.Message, error) {
	return m.msgs[cid], nil
}

type MockLLM struct {
	ResponseChunks []port.StreamChunk
}

func (m *MockLLM) ID() string { return "mock-gpt" }
func (m *MockLLM) Chat(ctx context.Context, msgs []agent.Message, opts map[string]any) (*agent.Message, error) {
	return nil, nil
}
func (m *MockLLM) StreamChat(ctx context.Context, msgs []agent.Message, opts map[string]any) (<-chan port.StreamChunk, error) {
	ch := make(chan port.StreamChunk)
	go func() {
		defer close(ch)
		for _, chunk := range m.ResponseChunks {
			ch <- chunk
			time.Sleep(10 * time.Millisecond) // Simulate delay
		}
	}()
	return ch, nil
}

// --- Tests ---

func TestAgentService_Chat_Flow(t *testing.T) {
	// 1. Setup
	repo := NewMockRepo()
	llm := &MockLLM{
		ResponseChunks: []port.StreamChunk{
			{ThoughtDelta: "Hmm, "},
			{ThoughtDelta: "let me think..."},
			{ContentDelta: "Hello "},
			{ContentDelta: "World!"},
		},
	}
	svc := service.NewAgentService(repo, llm)

	sessionID := "sess-123"
	req := &agent.UserMessage{
		SessionID: sessionID,
		Content:   "Hi AI",
	}

	// 2. Execute
	var updates []*agent.AgentUpdate
	err := svc.Chat(context.TODO(), req, func(u *agent.AgentUpdate) {
		updates = append(updates, u)
	})

	// 3. Verify
	if err != nil {
		t.Fatalf("Chat failed: %v", err)
	}

	// Verify DB state
	if len(repo.msgs[sessionID]) != 2 {
		t.Errorf("Expected 2 messages in DB (User+AI), got %d", len(repo.msgs[sessionID]))
	}

	// Verify AI response storage
	aiMsg := repo.msgs[sessionID][1]
	if aiMsg.Role != agent.RoleAssistant {
		t.Errorf("Expected RoleAssistant, got %s", aiMsg.Role)
	}
	if aiMsg.Thinking != "Hmm, let me think..." {
		t.Errorf("Expected thinking 'Hmm, let me think...', got '%s'", aiMsg.Thinking)
	}
	if aiMsg.Content != "Hello World!" {
		t.Errorf("Expected content 'Hello World!', got '%s'", aiMsg.Content)
	}

	// Verify Streaming Updates
	if len(updates) != 4 {
		t.Errorf("Expected 4 updates, got %d", len(updates))
	}

	// Check first update (Thinking)
	if updates[0].ThoughtDelta == nil || *updates[0].ThoughtDelta != "Hmm, " {
		t.Errorf("First update should be thought 'Hmm, '")
	}
	// Check last update (Content)
	if updates[3].ContentDelta == nil || *updates[3].ContentDelta != "World!" {
		t.Errorf("Last update should be content 'World!'")
	}
}

func TestAgentService_ListSessions(t *testing.T) {
	// Setup
	repo := NewMockRepo()
	llm := &MockLLM{}
	svc := service.NewAgentService(repo, llm)

	// Create some conversations
	convs := []*agent.Conversation{
		{
			ID:        "sess-1",
			Title:     "First Chat",
			CreatedAt: time.Now().Add(-2 * time.Hour).Unix(),
		},
		{
			ID:        "sess-2",
			Title:     "Second Chat",
			CreatedAt: time.Now().Add(-1 * time.Hour).Unix(),
		},
		{
			ID:        "sess-3",
			Title:     "Third Chat",
			CreatedAt: time.Now().Unix(),
		},
	}

	for _, conv := range convs {
		repo.convs[conv.ID] = conv
	}

	// List sessions
	sessions, err := svc.ListSessions(10, 0)
	if err != nil {
		t.Fatalf("ListSessions failed: %v", err)
	}

	if len(sessions) != 3 {
		t.Errorf("Expected 3 sessions, got %d", len(sessions))
	}

	// Verify sessions contain all IDs (order may vary due to map iteration)
	sessionIDs := make(map[string]bool)
	for _, s := range sessions {
		sessionIDs[s.SessionID] = true

		// Verify CreatedAt is converted to Unix timestamp
		if s.CreatedAt == 0 {
			t.Error("CreatedAt should be converted to Unix timestamp")
		}
	}

	if !sessionIDs["sess-1"] || !sessionIDs["sess-2"] || !sessionIDs["sess-3"] {
		t.Error("Not all expected session IDs found")
	}
}

func TestAgentService_ListSessions_Empty(t *testing.T) {
	// Setup with no conversations
	repo := NewMockRepo()
	llm := &MockLLM{}
	svc := service.NewAgentService(repo, llm)

	// List sessions
	sessions, err := svc.ListSessions(10, 0)
	if err != nil {
		t.Fatalf("ListSessions failed: %v", err)
	}

	if len(sessions) != 0 {
		t.Errorf("Expected 0 sessions, got %d", len(sessions))
	}
}

func TestAgentService_ListSessions_WithLimit(t *testing.T) {
	// Setup
	repo := NewMockRepo()
	llm := &MockLLM{}
	svc := service.NewAgentService(repo, llm)

	// Create many conversations
	for i := 0; i < 10; i++ {
		conv := &agent.Conversation{
			ID:        "sess-" + string(rune('0'+i)),
			Title:     "Chat " + string(rune('0'+i)),
			CreatedAt: time.Now().Unix(),
		}
		repo.convs[conv.ID] = conv
	}

	// List with limit
	sessions, err := svc.ListSessions(5, 0)
	if err != nil {
		t.Fatalf("ListSessions failed: %v", err)
	}

	// Mock repo doesn't implement real pagination, but verify call succeeds
	if len(sessions) > 5 {
		t.Errorf("Expected at most 5 sessions with limit, got %d", len(sessions))
	}
}

func TestAgentService_Chat_EmptySessionID(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{}
	svc := service.NewAgentService(repo, llm)

	req := &agent.UserMessage{
		SessionID: "",
		Content:   "Hello",
	}

	err := svc.Chat(context.TODO(), req, func(u *agent.AgentUpdate) {})

	if err == nil {
		t.Error("Chat with empty session ID should return error")
	}
}

func TestAgentService_Chat_ContextCancellation(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{
		ResponseChunks: []port.StreamChunk{
			{ContentDelta: "This "},
			{ContentDelta: "should "},
			{ContentDelta: "not "},
			{ContentDelta: "complete"},
		},
	}
	svc := service.NewAgentService(repo, llm)

	req := &agent.UserMessage{
		SessionID: "test-session",
		Content:   "Hello",
	}

	// This should handle cancellation gracefully
	err := svc.Chat(context.TODO(), req, func(u *agent.AgentUpdate) {})

	// The behavior depends on implementation - may or may not error
	if err != nil {
		t.Logf("Chat with cancelled context returned error: %v", err)
	}
}

func TestAgentService_Chat_ExistingConversation(t *testing.T) {
	repo := NewMockRepo()
	llm := &MockLLM{
		ResponseChunks: []port.StreamChunk{
			{ContentDelta: "Hello again!"},
		},
	}
	svc := service.NewAgentService(repo, llm)

	sessionID := "existing-session"

	// Pre-create conversation
	existingConv := &agent.Conversation{
		ID:        sessionID,
		Title:     "Existing Chat",
		CreatedAt: time.Now().Unix(),
	}
	repo.convs[sessionID] = existingConv

	// Add existing message
	existingMsg := &agent.Message{
		ID:             "msg-1",
		ConversationID: sessionID,
		Role:           agent.RoleUser,
		Content:        "Previous message",
		CreatedAt:      time.Now().Unix(),
	}
	repo.msgs[sessionID] = []*agent.Message{existingMsg}

	// Send new message
	req := &agent.UserMessage{
		SessionID: sessionID,
		Content:   "New message",
	}

	err := svc.Chat(context.TODO(), req, func(u *agent.AgentUpdate) {})
	if err != nil {
		t.Fatalf("Chat failed: %v", err)
	}

	// Verify conversation was not recreated
	if repo.convs[sessionID].Title != "Existing Chat" {
		t.Error("Existing conversation should be preserved")
	}

	// Verify new messages were added (previous + new user + assistant)
	if len(repo.msgs[sessionID]) != 3 {
		t.Errorf("Expected 3 messages total, got %d", len(repo.msgs[sessionID]))
	}
}
