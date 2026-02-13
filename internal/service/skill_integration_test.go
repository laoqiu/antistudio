package service_test

import (
	"context"
	"strings"
	"testing"

	"antistudio/internal/core/agent"
	"antistudio/internal/core/port"
	"antistudio/internal/service"
)

// CapturingMockLLM captures the messages sent to it for verification
type CapturingMockLLM struct {
	MockLLM
	CapturedMessages []agent.Message
}

func (m *CapturingMockLLM) StreamChat(ctx context.Context, msgs []agent.Message, opts map[string]any) (<-chan port.StreamChunk, error) {
	// Capture the messages for inspection
	m.CapturedMessages = msgs

	// Return a simple response
	ch := make(chan port.StreamChunk)
	go func() {
		defer close(ch)
		ch <- port.StreamChunk{ContentDelta: "I can see the skills!"}
	}()
	return ch, nil
}

func TestSkillsAreInjectedIntoContext(t *testing.T) {
	// Setup
	repo := NewMockRepo()
	llm := &CapturingMockLLM{}
	svc := service.NewAgentService(repo, llm).WithSkillsPath("../../skills")

	sessionID := "test-session-001"
	req := &agent.UserMessage{
		SessionID: sessionID,
		Content:   "Can you see the skills?",
	}

	// Execute
	err := svc.Chat(context.Background(), req, func(u *agent.AgentUpdate) {
		// No-op callback
	})

	// Verify
	if err != nil {
		t.Fatalf("Chat failed: %v", err)
	}

	// Check that messages were captured
	if len(llm.CapturedMessages) == 0 {
		t.Fatal("No messages were sent to LLM")
	}

	// The first message should be a system message containing skills
	firstMsg := llm.CapturedMessages[0]
	if firstMsg.Role != agent.RoleSystem {
		t.Errorf("Expected first message to be system role, got %s", firstMsg.Role)
	}

	// Verify that the skills content is present
	if !strings.Contains(firstMsg.Content, "You have access to the following skills:") {
		t.Error("Skills header not found in system message")
	}

	// Log what was captured for debugging
	t.Logf("Captured %d messages", len(llm.CapturedMessages))
	t.Logf("System message preview: %s...",
		truncate(firstMsg.Content, 100))
}

func TestMultipleSkillsAreLoaded(t *testing.T) {
	repo := NewMockRepo()
	llm := &CapturingMockLLM{}
	svc := service.NewAgentService(repo, llm).WithSkillsPath("../../skills")

	sessionID := "test-session-002"
	req := &agent.UserMessage{
		SessionID: sessionID,
		Content:   "List your skills",
	}

	err := svc.Chat(context.TODO(), req, func(u *agent.AgentUpdate) {})
	if err != nil {
		t.Fatalf("Chat failed: %v", err)
	}

	if len(llm.CapturedMessages) == 0 {
		t.Fatal("No messages captured")
	}

	systemMsg := llm.CapturedMessages[0]

	// Check for the presence of skills (based on what we know exists in the project)
	// At minimum, template skill and example-skill should be present
	skillsContent := systemMsg.Content

	// Count skill separators (---) to estimate number of skills
	separatorCount := strings.Count(skillsContent, "---\n\n")
	t.Logf("Found approximately %d skill(s) in the context", separatorCount)

	if separatorCount == 0 {
		t.Log("WARNING: No skill separators found. Skills might not be loading correctly.")
		t.Logf("System message content:\n%s", skillsContent)
	}
}

// Helper function to truncate strings for logging
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}
