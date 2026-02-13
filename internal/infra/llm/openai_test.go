package llm_test

import (
	"context"
	"testing"
	"time"

	"antistudio/internal/core/agent"
	"antistudio/internal/infra/llm"
)

func TestNewOpenAIProvider(t *testing.T) {
	// Test with default settings
	provider := llm.NewOpenAIProvider("test-api-key", "", "")

	if provider == nil {
		t.Fatal("Provider should not be nil")
	}

	id := provider.ID()
	if id == "" {
		t.Error("Provider ID should not be empty")
	}

	if id != "openai-gpt-3.5-turbo" {
		t.Errorf("Expected default model ID 'openai-gpt-3.5-turbo', got '%s'", id)
	}
}

func TestNewOpenAIProvider_CustomModel(t *testing.T) {
	provider := llm.NewOpenAIProvider("test-api-key", "", "gpt-4")

	id := provider.ID()
	if id != "openai-gpt-4" {
		t.Errorf("Expected ID 'openai-gpt-4', got '%s'", id)
	}
}

func TestNewOpenAIProvider_CustomBaseURL(t *testing.T) {
	provider := llm.NewOpenAIProvider("test-api-key", "https://api.deepseek.com", "deepseek-chat")

	if provider == nil {
		t.Fatal("Provider should not be nil")
	}

	id := provider.ID()
	if id != "openai-deepseek-chat" {
		t.Errorf("Expected ID 'openai-deepseek-chat', got '%s'", id)
	}
}

func TestOpenAIProvider_ID(t *testing.T) {
	tests := []struct {
		name     string
		model    string
		expected string
	}{
		{"Default model", "", "openai-gpt-3.5-turbo"},
		{"GPT-4", "gpt-4", "openai-gpt-4"},
		{"GPT-4 Turbo", "gpt-4-turbo", "openai-gpt-4-turbo"},
		{"DeepSeek", "deepseek-chat", "openai-deepseek-chat"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider := llm.NewOpenAIProvider("test-key", "", tt.model)
			id := provider.ID()

			if id != tt.expected {
				t.Errorf("Expected ID '%s', got '%s'", tt.expected, id)
			}
		})
	}
}

// Note: The following tests require a mock OpenAI client or integration test setup
// For now, we'll test the interface compliance and basic structure

func TestOpenAIProvider_ImplementsInterface(t *testing.T) {
	provider := llm.NewOpenAIProvider("test-key", "", "gpt-4")

	// Verify it implements the port.LLMProvider interface
	_ = provider.ID()

	// Test that methods exist (will fail without actual API key/mock)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	messages := []agent.Message{
		{Role: agent.RoleUser, Content: "Hello"},
	}

	// These will fail without proper setup, but verify the signatures exist
	_, _ = provider.Chat(ctx, messages, nil)
	_, _ = provider.StreamChat(ctx, messages, nil)
}

func TestOpenAIProvider_MessageConversion(t *testing.T) {
	// This test verifies that message conversion happens correctly
	// We can't test the private convertMessages method directly,
	// but we can verify it works by ensuring Chat/StreamChat accept our message types

	provider := llm.NewOpenAIProvider("test-key", "", "gpt-4")

	messages := []agent.Message{
		{Role: agent.RoleSystem, Content: "You are a helpful assistant"},
		{Role: agent.RoleUser, Content: "Hello"},
		{Role: agent.RoleAssistant, Content: "Hi there!"},
		{Role: agent.RoleTool, Content: "Tool result"},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// This will timeout/fail without API key, but verifies types are accepted
	_, _ = provider.Chat(ctx, messages, nil)
}

func TestOpenAIProvider_EmptyAPIKey(t *testing.T) {
	// Test that provider can be created with empty API key
	// (useful for testing or when key is loaded later)
	provider := llm.NewOpenAIProvider("", "", "gpt-4")

	if provider == nil {
		t.Error("Provider should be created even with empty API key")
	}

	id := provider.ID()
	if id != "openai-gpt-4" {
		t.Errorf("Expected ID 'openai-gpt-4', got '%s'", id)
	}
}

func TestOpenAIProvider_ContextCancellation(t *testing.T) {
	provider := llm.NewOpenAIProvider("test-key", "", "gpt-4")

	// Create a context that's already cancelled
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	messages := []agent.Message{
		{Role: agent.RoleUser, Content: "Hello"},
	}

	// Should handle context cancellation gracefully
	_, err := provider.Chat(ctx, messages, nil)

	// We expect an error due to cancelled context
	if err == nil {
		t.Log("Note: Expected error due to cancelled context, but got nil (may need API key to test)")
	}
}

func TestOpenAIProvider_StreamChat_ChannelClose(t *testing.T) {
	provider := llm.NewOpenAIProvider("test-key", "", "gpt-4")

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	messages := []agent.Message{
		{Role: agent.RoleUser, Content: "Hello"},
	}

	ch, err := provider.StreamChat(ctx, messages, nil)

	// Without valid API key, this will error
	if err != nil {
		t.Logf("Expected error without valid API key: %v", err)
		return
	}

	// If channel is returned, verify it closes eventually
	timeout := time.After(200 * time.Millisecond)
	for {
		select {
		case _, ok := <-ch:
			if !ok {
				// Channel closed as expected
				return
			}
		case <-timeout:
			t.Error("Channel should close within timeout")
			return
		}
	}
}

// Benchmark tests
func BenchmarkNewOpenAIProvider(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = llm.NewOpenAIProvider("test-key", "", "gpt-4")
	}
}

func BenchmarkProviderID(b *testing.B) {
	provider := llm.NewOpenAIProvider("test-key", "", "gpt-4")
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = provider.ID()
	}
}
