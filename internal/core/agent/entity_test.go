package agent_test

import (
	"testing"
	"time"

	"antistudio/internal/core/agent"
)

func TestConversation_Creation(t *testing.T) {
	conv := &agent.Conversation{
		ID:        "test-id-123",
		Title:     "Test Conversation",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
		Metadata:  `{"model":"gpt-4"}`,
	}

	if conv.ID != "test-id-123" {
		t.Errorf("Expected ID 'test-id-123', got '%s'", conv.ID)
	}

	if conv.Title != "Test Conversation" {
		t.Errorf("Expected title 'Test Conversation', got '%s'", conv.Title)
	}
}

func TestRole_Constants(t *testing.T) {
	tests := []struct {
		role     agent.Role
		expected string
	}{
		{agent.RoleSystem, "system"},
		{agent.RoleUser, "user"},
		{agent.RoleAssistant, "assistant"},
		{agent.RoleTool, "tool"},
	}

	for _, tt := range tests {
		if string(tt.role) != tt.expected {
			t.Errorf("Expected role '%s', got '%s'", tt.expected, tt.role)
		}
	}
}

func TestMessage_Creation(t *testing.T) {
	msg := &agent.Message{
		ID:               "msg-123",
		ConversationID:   "conv-456",
		Role:             agent.RoleUser,
		Content:          "Hello, AI!",
		Thinking:         "",
		PromptTokens:     10,
		CompletionTokens: 0,
		CreatedAt:        time.Now().Unix(),
	}

	if msg.ID != "msg-123" {
		t.Errorf("Expected ID 'msg-123', got '%s'", msg.ID)
	}

	if msg.Role != agent.RoleUser {
		t.Errorf("Expected role 'user', got '%s'", msg.Role)
	}

	if msg.Content != "Hello, AI!" {
		t.Errorf("Expected content 'Hello, AI!', got '%s'", msg.Content)
	}

	if msg.PromptTokens != 10 {
		t.Errorf("Expected prompt tokens 10, got %d", msg.PromptTokens)
	}
}

func TestMessage_AllRoles(t *testing.T) {
	roles := []agent.Role{
		agent.RoleSystem,
		agent.RoleUser,
		agent.RoleAssistant,
		agent.RoleTool,
	}

	for _, role := range roles {
		msg := &agent.Message{
			ID:             "test-id",
			ConversationID: "test-conv",
			Role:           role,
			Content:        "test content",
			CreatedAt:      time.Now().Unix(),
		}

		if msg.Role != role {
			t.Errorf("Expected role %s, got %s", role, msg.Role)
		}
	}
}

func TestMessage_WithThinking(t *testing.T) {
	msg := &agent.Message{
		ID:             "msg-thinking",
		ConversationID: "conv-123",
		Role:           agent.RoleAssistant,
		Content:        "The answer is 42",
		Thinking:       "Let me think... First I need to...",
		CreatedAt:      time.Now().Unix(),
	}

	if msg.Thinking != "Let me think... First I need to..." {
		t.Errorf("Expected thinking content, got '%s'", msg.Thinking)
	}

	if msg.Content != "The answer is 42" {
		t.Errorf("Expected content 'The answer is 42', got '%s'", msg.Content)
	}
}

func TestMessage_TokenCounting(t *testing.T) {
	msg := &agent.Message{
		ID:               "msg-tokens",
		ConversationID:   "conv-123",
		Role:             agent.RoleAssistant,
		Content:          "Response",
		PromptTokens:     100,
		CompletionTokens: 50,
		CreatedAt:        time.Now().Unix(),
	}

	if msg.PromptTokens != 100 {
		t.Errorf("Expected 100 prompt tokens, got %d", msg.PromptTokens)
	}

	if msg.CompletionTokens != 50 {
		t.Errorf("Expected 50 completion tokens, got %d", msg.CompletionTokens)
	}

	totalTokens := msg.PromptTokens + msg.CompletionTokens
	if totalTokens != 150 {
		t.Errorf("Expected 150 total tokens, got %d", totalTokens)
	}
}
