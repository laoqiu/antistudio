package port

import (
	"context"

	"antistudio/internal/core/agent"
)

// StreamChunk represents a piece of the generated response
type StreamChunk struct {
	ContentDelta string
	ThoughtDelta string // Used for models like DeepSeek R1 with reasoning
}

// LLMProvider defines the interface for Large Language Model interactions.
type LLMProvider interface {
	// ID returns the provider identifier (e.g., "openai-gpt4")
	ID() string

	// Chat sends a list of messages and returns the full response.
	Chat(ctx context.Context, messages []agent.Message, options map[string]any) (*agent.Message, error)

	// StreamChat sends messages and streams chunks.
	StreamChat(ctx context.Context, messages []agent.Message, options map[string]any) (<-chan StreamChunk, error)
}
