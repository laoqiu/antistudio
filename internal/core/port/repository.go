package port

import (
	"antistudio/internal/core/agent"
)

// ConversationRepository defines data access for chat sessions
type ConversationRepository interface {
	Create(conv *agent.Conversation) error
	Get(id string) (*agent.Conversation, error)
	List(limit int, offset int) ([]*agent.Conversation, error)
	Update(conv *agent.Conversation) error
	Delete(id string) error
	
	// Message operations
	SaveMessage(msg *agent.Message) error
	GetMessages(conversationID string, limit int) ([]*agent.Message, error)
}
