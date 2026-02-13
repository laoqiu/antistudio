package agent_test

import (
	"encoding/json"
	"testing"

	"antistudio/internal/core/agent"
)

func TestSessionMeta_Creation(t *testing.T) {
	meta := agent.SessionMeta{
		SessionID: "session-123",
		Title:     "Test Session",
		CreatedAt: 1234567890,
	}

	if meta.SessionID != "session-123" {
		t.Errorf("Expected session ID 'session-123', got '%s'", meta.SessionID)
	}

	if meta.Title != "Test Session" {
		t.Errorf("Expected title 'Test Session', got '%s'", meta.Title)
	}

	if meta.CreatedAt != 1234567890 {
		t.Errorf("Expected created_at 1234567890, got %d", meta.CreatedAt)
	}
}

func TestUserMessage_Creation(t *testing.T) {
	msg := agent.UserMessage{
		SessionID: "session-456",
		Content:   "Hello, world!",
		FilePaths: []string{"/path/to/file1.txt", "/path/to/file2.txt"},
	}

	if msg.SessionID != "session-456" {
		t.Errorf("Expected session ID 'session-456', got '%s'", msg.SessionID)
	}

	if msg.Content != "Hello, world!" {
		t.Errorf("Expected content 'Hello, world!', got '%s'", msg.Content)
	}

	if len(msg.FilePaths) != 2 {
		t.Errorf("Expected 2 file paths, got %d", len(msg.FilePaths))
	}
}

func TestEventType_Constants(t *testing.T) {
	tests := []struct {
		eventType agent.EventType
		expected  string
	}{
		{agent.EventContextPruned, "CONTEXT_PRUNED"},
		{agent.EventMemorySaved, "MEMORY_SAVED"},
		{agent.EventError, "ERROR"},
	}

	for _, tt := range tests {
		if string(tt.eventType) != tt.expected {
			t.Errorf("Expected event type '%s', got '%s'", tt.expected, tt.eventType)
		}
	}
}

func TestSystemNotification_Creation(t *testing.T) {
	notif := agent.SystemNotification{
		Type:            agent.EventError,
		Message:         "An error occurred",
		TechnicalDetail: "Error: connection timeout at line 42",
	}

	if notif.Type != agent.EventError {
		t.Errorf("Expected type ERROR, got %s", notif.Type)
	}

	if notif.Message != "An error occurred" {
		t.Errorf("Expected message 'An error occurred', got '%s'", notif.Message)
	}
}

func TestInteractionRequest_Confirm(t *testing.T) {
	req := agent.InteractionRequest{
		Type:   "confirm",
		Prompt: "Do you want to proceed?",
	}

	if req.Type != "confirm" {
		t.Errorf("Expected type 'confirm', got '%s'", req.Type)
	}

	if req.Prompt != "Do you want to proceed?" {
		t.Errorf("Expected prompt 'Do you want to proceed?', got '%s'", req.Prompt)
	}
}

func TestInteractionRequest_Select(t *testing.T) {
	req := agent.InteractionRequest{
		Type:    "select",
		Prompt:  "Choose an option:",
		Options: []string{"Option A", "Option B", "Option C"},
	}

	if req.Type != "select" {
		t.Errorf("Expected type 'select', got '%s'", req.Type)
	}

	if len(req.Options) != 3 {
		t.Errorf("Expected 3 options, got %d", len(req.Options))
	}

	if req.Options[0] != "Option A" {
		t.Errorf("Expected first option 'Option A', got '%s'", req.Options[0])
	}
}

func TestInteractionRequest_Input(t *testing.T) {
	req := agent.InteractionRequest{
		Type:   "input",
		Prompt: "Enter your name:",
	}

	if req.Type != "input" {
		t.Errorf("Expected type 'input', got '%s'", req.Type)
	}

	if req.Prompt != "Enter your name:" {
		t.Errorf("Expected prompt 'Enter your name:', got '%s'", req.Prompt)
	}
}

func TestLocalFile_Creation(t *testing.T) {
	file := agent.LocalFile{
		Path:    "/path/to/file.txt",
		Action:  "created",
		Content: "File content here",
	}

	if file.Path != "/path/to/file.txt" {
		t.Errorf("Expected path '/path/to/file.txt', got '%s'", file.Path)
	}

	if file.Action != "created" {
		t.Errorf("Expected action 'created', got '%s'", file.Action)
	}

	if file.Content != "File content here" {
		t.Errorf("Expected content, got '%s'", file.Content)
	}
}

func TestAgentUpdate_AllFields(t *testing.T) {
	thoughtDelta := "Thinking..."
	contentDelta := "Response..."
	execOutput := "Command output"

	interaction := &agent.InteractionRequest{
		Type:   "confirm",
		Prompt: "Proceed with action?",
	}

	file := &agent.LocalFile{
		Path:   "/test.txt",
		Action: "created",
	}

	systemEvent := &agent.SystemNotification{
		Type:    agent.EventError,
		Message: "Error occurred",
	}

	update := agent.AgentUpdate{
		SessionID:       "session-123",
		ThoughtDelta:    &thoughtDelta,
		ContentDelta:    &contentDelta,
		Interaction:     interaction,
		ExecutionOutput: &execOutput,
		File:            file,
		SystemEvent:     systemEvent,
	}

	if update.SessionID != "session-123" {
		t.Errorf("Expected session ID 'session-123', got '%s'", update.SessionID)
	}

	if update.ThoughtDelta == nil || *update.ThoughtDelta != "Thinking..." {
		t.Error("ThoughtDelta not set correctly")
	}

	if update.ContentDelta == nil || *update.ContentDelta != "Response..." {
		t.Error("ContentDelta not set correctly")
	}

	if update.Interaction == nil || update.Interaction.Type != "confirm" {
		t.Error("Interaction not set correctly")
	}

	if update.File == nil || update.File.Path != "/test.txt" {
		t.Error("File not set correctly")
	}

	if update.SystemEvent == nil || update.SystemEvent.Type != agent.EventError {
		t.Error("SystemEvent not set correctly")
	}
}

func TestNewThoughtUpdate(t *testing.T) {
	update := agent.NewThoughtUpdate("session-123", "I'm thinking...")

	if update.SessionID != "session-123" {
		t.Errorf("Expected session ID 'session-123', got '%s'", update.SessionID)
	}

	if update.ThoughtDelta == nil {
		t.Fatal("ThoughtDelta should not be nil")
	}

	if *update.ThoughtDelta != "I'm thinking..." {
		t.Errorf("Expected thought 'I'm thinking...', got '%s'", *update.ThoughtDelta)
	}

	// Verify other fields are nil
	if update.ContentDelta != nil {
		t.Error("ContentDelta should be nil")
	}

	if update.Interaction != nil {
		t.Error("Interaction should be nil")
	}
}

func TestNewContentUpdate(t *testing.T) {
	update := agent.NewContentUpdate("session-456", "Here's my response")

	if update.SessionID != "session-456" {
		t.Errorf("Expected session ID 'session-456', got '%s'", update.SessionID)
	}

	if update.ContentDelta == nil {
		t.Fatal("ContentDelta should not be nil")
	}

	if *update.ContentDelta != "Here's my response" {
		t.Errorf("Expected content 'Here's my response', got '%s'", *update.ContentDelta)
	}

	// Verify other fields are nil
	if update.ThoughtDelta != nil {
		t.Error("ThoughtDelta should be nil")
	}

	if update.Interaction != nil {
		t.Error("Interaction should be nil")
	}
}

func TestAgentUpdate_JSONSerialization(t *testing.T) {
	delta := "test delta"
	update := agent.AgentUpdate{
		SessionID:    "session-789",
		ContentDelta: &delta,
	}

	// Serialize to JSON
	jsonData, err := json.Marshal(update)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	// Deserialize from JSON
	var decoded agent.AgentUpdate
	if err := json.Unmarshal(jsonData, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if decoded.SessionID != "session-789" {
		t.Errorf("Expected session ID 'session-789', got '%s'", decoded.SessionID)
	}

	if decoded.ContentDelta == nil || *decoded.ContentDelta != "test delta" {
		t.Error("ContentDelta not preserved after JSON round-trip")
	}

	// Verify nil fields are omitted
	var jsonMap map[string]interface{}
	json.Unmarshal(jsonData, &jsonMap)

	if _, exists := jsonMap["thought_delta"]; exists {
		t.Error("thought_delta should be omitted when nil")
	}
}

func TestLocalFile_Actions(t *testing.T) {
	actions := []string{"created", "modified", "opened", "deleted"}

	for _, action := range actions {
		file := agent.LocalFile{
			Path:   "/test.txt",
			Action: action,
		}

		if file.Action != action {
			t.Errorf("Expected action '%s', got '%s'", action, file.Action)
		}
	}
}
