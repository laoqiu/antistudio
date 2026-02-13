package app

import (
	"context"
	"fmt"
	"time"

	"antistudio/internal/core/agent"
	"antistudio/internal/infra/llm"
	"antistudio/internal/service"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// AgentAPI provides the API for frontend to interact with the agent.
// IMPORTANT: All struct fields must be JSON serializable for Wails binding.
// Do NOT store context.Context, channels, or function types in struct fields.
type AgentAPI struct {
	agentService *service.AgentService
	llmFactory   *llm.ProviderFactory
}

func NewAgentAPI(svc *service.AgentService, factory *llm.ProviderFactory) *AgentAPI {
	return &AgentAPI{
		agentService: svc,
		llmFactory:   factory,
	}
}

// ChatRequest is the request structure for Chat method
// Must be JSON serializable
type ChatRequest struct {
	SessionID string   `json:"session_id"`           // Optional, auto-generated if empty
	Content   string   `json:"content"`              // Required
	Model     string   `json:"model"`                // Required: "gpt-4o", "deepseek-chat", etc.
	FilePaths []string `json:"file_paths,omitempty"` // Optional file attachments
}

// ChatResponse is the response structure for Chat method
type ChatResponse struct {
	SessionID string `json:"session_id"`
	Success   bool   `json:"success"`
	Error     string `json:"error,omitempty"`
}

// Chat is the main entry point for the frontend to send messages.
// It returns immediately with the session ID, while the response is streamed via events.
//
// IMPORTANT: ctx is automatically injected by Wails runtime.
// Frontend calls this without passing context - Wails handles it transparently.
func (a *AgentAPI) Chat(ctx context.Context, req ChatRequest) ChatResponse {
	// Validate request
	if req.Content == "" {
		return ChatResponse{
			SessionID: req.SessionID,
			Success:   false,
			Error:     "content cannot be empty",
		}
	}

	if req.Model == "" {
		return ChatResponse{
			SessionID: req.SessionID,
			Success:   false,
			Error:     "model must be specified",
		}
	}

	// Create LLM provider for the specified model
	llmProvider, err := a.llmFactory.CreateProvider(req.Model)
	if err != nil {
		return ChatResponse{
			SessionID: req.SessionID,
			Success:   false,
			Error:     fmt.Sprintf("failed to create LLM provider: %v", err),
		}
	}

	// Convert to domain model
	userMsg := &agent.UserMessage{
		SessionID: req.SessionID,
		Content:   req.Content,
		FilePaths: req.FilePaths,
	}

	// If no session ID provided, generate one
	if userMsg.SessionID == "" {
		userMsg.SessionID = generateSessionID()
	}

	// Run Chat in a goroutine to not block the Wails UI thread
	go func() {
		// Create callback for streaming updates
		onUpdate := func(update *agent.AgentUpdate) {
			// Emit event to frontend using Wails runtime context
			// Event name: "agent_update:{session_id}"
			eventName := fmt.Sprintf("agent_update:%s", update.SessionID)
			runtime.EventsEmit(ctx, eventName, update)
		}

		// Call service layer with specific LLM provider and model
		err := a.agentService.ChatWithProvider(ctx, userMsg, req.Model, llmProvider, onUpdate)

		// If error occurred, emit error event
		if err != nil {
			runtime.EventsEmit(ctx, fmt.Sprintf("agent_update:%s", userMsg.SessionID), &agent.AgentUpdate{
				SessionID: userMsg.SessionID,
				SystemEvent: &agent.SystemNotification{
					Type:    agent.EventError,
					Message: fmt.Sprintf("Chat error: %v", err),
				},
			})
		}

		// Emit session_end event
		runtime.EventsEmit(ctx, fmt.Sprintf("agent_update:%s", userMsg.SessionID), &agent.AgentUpdate{
			SessionID: userMsg.SessionID,
			SystemEvent: &agent.SystemNotification{
				Type:    "session_end",
				Message: "Chat completed",
			},
		})
	}()

	return ChatResponse{
		SessionID: userMsg.SessionID,
		Success:   true,
	}
}

// ListSessionsRequest is the request structure for ListSessions
type ListSessionsRequest struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

// ListSessionsResponse wraps the session list
type ListSessionsResponse struct {
	Sessions []agent.SessionMeta `json:"sessions"`
	Total    int                 `json:"total"`
	Error    string              `json:"error,omitempty"`
}

// ListSessions returns the list of recent conversations
// Context is automatically injected by Wails but not used in this method
func (a *AgentAPI) ListSessions(ctx context.Context, req ListSessionsRequest) ListSessionsResponse {
	// Set defaults
	if req.Limit <= 0 {
		req.Limit = 50
	}

	sessions, err := a.agentService.ListSessions(req.Limit, req.Offset)
	if err != nil {
		return ListSessionsResponse{
			Error: fmt.Sprintf("Failed to list sessions: %v", err),
		}
	}

	return ListSessionsResponse{
		Sessions: sessions,
		Total:    len(sessions),
	}
}

// generateSessionID generates a unique session ID
func generateSessionID() string {
	// Use UUID for session ID
	// In production, this ensures uniqueness
	return fmt.Sprintf("session-%d", time.Now().UnixNano())
}
