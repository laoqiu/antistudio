package agent

// Conversation is the database entity for a chat session
type Conversation struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Model     string `json:"model"`      // LLM model: "gpt-4o", "deepseek-chat", etc.
	Metadata  string `json:"metadata"`   // Additional settings (JSON string)
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
	DeletedAt int64  `json:"-"`
}

// Role defines who sent the message
type Role string

const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
	RoleTool      Role = "tool"
)

// Message is the database entity for an individual chat message
type Message struct {
	ID             string `json:"id"`
	ConversationID string `json:"conversation_id"`
	Role           Role   `json:"role"`
	Content        string `json:"content"`
	Thinking       string `json:"thinking,omitempty"` // Internal chain of thought
	PromptTokens     int  `json:"prompt_tokens"`      // Token usage for billing
	CompletionTokens int  `json:"completion_tokens"`
	CreatedAt      int64  `json:"created_at"`
}
