package agent

// SessionMeta corresponds to the Proto SessionMeta
type SessionMeta struct {
	SessionID string `json:"session_id"`
	Title     string `json:"title"` // Auto-generated summary title
	CreatedAt int64  `json:"created_at"`
}

// UserMessage corresponds to the Proto UserMessage
type UserMessage struct {
	SessionID string   `json:"session_id"` // MUST act as the routing key
	Content   string   `json:"content"`
	FilePaths []string `json:"file_paths"`
}

// EventType for SystemNotification
type EventType string

const (
	EventContextPruned EventType = "CONTEXT_PRUNED"
	EventMemorySaved   EventType = "MEMORY_SAVED"
	EventError         EventType = "ERROR"
)

// SystemNotification corresponds to the Proto SystemNotification
type SystemNotification struct {
	Type            EventType `json:"type"`
	Message         string    `json:"message"`          // User-facing hint
	TechnicalDetail string    `json:"technical_detail"` // Actual Markdown or technical log
}

// InteractionRequest for A2UI components
// Represents requests for user interaction (confirm, input, select)
type InteractionRequest struct {
	Type    string   `json:"type"`              // "confirm", "input", "select"
	Prompt  string   `json:"prompt"`            // Question or message to display
	Options []string `json:"options,omitempty"` // For "select" type
}

// LocalFile represents a file-related update
type LocalFile struct {
	Path    string `json:"path"`
	Action  string `json:"action"` // "created", "modified", "opened"
	Content string `json:"content,omitempty"`
}

// AgentUpdate corresponds to the Proto AgentUpdate
// We use pointers with 'omitempty' to simulate the 'oneof' behavior in JSON.
type AgentUpdate struct {
	SessionID string `json:"session_id"`

	// Oneof data mapping
	ThoughtDelta    *string             `json:"thought_delta,omitempty"`
	ContentDelta    *string             `json:"content_delta,omitempty"`
	Interaction     *InteractionRequest `json:"interaction,omitempty"`
	ExecutionOutput *string             `json:"execution_output,omitempty"`
	File            *LocalFile          `json:"file,omitempty"`
	SystemEvent     *SystemNotification `json:"system_event,omitempty"`
}

// Helper methods to create updates
func NewThoughtUpdate(sessionID, delta string) *AgentUpdate {
	return &AgentUpdate{SessionID: sessionID, ThoughtDelta: &delta}
}

func NewContentUpdate(sessionID, delta string) *AgentUpdate {
	return &AgentUpdate{SessionID: sessionID, ContentDelta: &delta}
}
