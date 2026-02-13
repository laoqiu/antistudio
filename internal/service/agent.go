package service

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"antistudio/internal/core/agent"
	"antistudio/internal/core/port"

	"github.com/google/uuid"
)

type AgentService struct {
	repo       port.ConversationRepository
	llm        port.LLMProvider
	skillsPath string
}

func NewAgentService(repo port.ConversationRepository, llm port.LLMProvider) *AgentService {
	return &AgentService{
		repo:       repo,
		llm:        llm,
		skillsPath: "skills", // Default path
	}
}

// WithSkillsPath sets a custom skills directory path
func (s *AgentService) WithSkillsPath(path string) *AgentService {
	s.skillsPath = path
	return s
}

func (s *AgentService) loadSkills() (string, error) {
	skillsPath := s.skillsPath
	var skillsContent strings.Builder
	skillsContent.WriteString("You have access to the following skills:\n\n")

	err := filepath.Walk(skillsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && info.Name() == "SKILL.md" {
			content, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			skillsContent.Write(content)
			skillsContent.WriteString("\n\n---\n\n")
		}
		return nil
	})

	if err != nil {
		// If skills directory doesn't exist, just return empty
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}

	return skillsContent.String(), nil
}

// Chat handles the full lifecycle of a user interaction (deprecated, use ChatWithProvider)
func (s *AgentService) Chat(ctx context.Context, req *agent.UserMessage, onUpdate func(*agent.AgentUpdate)) error {
	// Use default LLM provider
	return s.ChatWithProvider(ctx, req, "gpt-4o", s.llm, onUpdate)
}

// ChatWithProvider handles the full lifecycle of a user interaction with specified LLM provider
func (s *AgentService) ChatWithProvider(ctx context.Context, req *agent.UserMessage, model string, llmProvider port.LLMProvider, onUpdate func(*agent.AgentUpdate)) error {
	sessionID := req.SessionID
	if sessionID == "" {
		return fmt.Errorf("session_id is required")
	}

	// 1. Ensure Conversation exists
	conv, err := s.repo.Get(sessionID)
	if err != nil {
		return err
	}
	if conv == nil {
		// Create new conversation if not exists
		conv = &agent.Conversation{
			ID:        sessionID,
			Title:     "New Chat", // Initially
			Model:     model,      // Store the model used
			Metadata:  "{}",
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
		}
		if err := s.repo.Create(conv); err != nil {
			return err
		}
	}

	// 2. Save User Message to DB
	userMsg := &agent.Message{
		ID:             uuid.New().String(),
		ConversationID: sessionID,
		Role:           agent.RoleUser,
		Content:        req.Content,
		CreatedAt:      time.Now().Unix(),
	}
	if err := s.repo.SaveMessage(userMsg); err != nil {
		return err
	}

	// 3. Load History for Context (e.g., last 20 messages)
	history, err := s.repo.GetMessages(sessionID, 20)
	if err != nil {
		return err
	}

	// 4. Call LLM for Streaming Response
	var contextMsgs []agent.Message

	// 4a. Inject Skills as System Prompt
	skills, err := s.loadSkills()
	if err == nil && skills != "" {
		contextMsgs = append(contextMsgs, agent.Message{
			Role:    agent.RoleSystem,
			Content: skills,
		})
	}

	// 4b. Add Conversation History
	for _, m := range history {
		contextMsgs = append(contextMsgs, *m)
	}

	tokenChan, err := llmProvider.StreamChat(ctx, contextMsgs, nil)
	if err != nil {
		return err
	}

	// 5. Consume Stream and notify UI
	var fullContent strings.Builder
	var fullThinking strings.Builder
	for chunk := range tokenChan {
		if chunk.ThoughtDelta != "" {
			fullThinking.WriteString(chunk.ThoughtDelta)
			onUpdate(agent.NewThoughtUpdate(sessionID, chunk.ThoughtDelta))
		}

		if chunk.ContentDelta != "" {
			fullContent.WriteString(chunk.ContentDelta)
			onUpdate(agent.NewContentUpdate(sessionID, chunk.ContentDelta))
		}
	}

	// 6. Save Assistant Response to DB
	assistantMsg := &agent.Message{
		ID:             uuid.New().String(),
		ConversationID: sessionID,
		Role:           agent.RoleAssistant,
		Content:        fullContent.String(),
		Thinking:       fullThinking.String(),
		CreatedAt:      time.Now().Unix(),
	}

	return s.repo.SaveMessage(assistantMsg)
}

// ListSessions returns recent conversations
func (s *AgentService) ListSessions(limit, offset int) ([]agent.SessionMeta, error) {
	convs, err := s.repo.List(limit, offset)
	if err != nil {
		return nil, err
	}

	var metas []agent.SessionMeta
	for _, c := range convs {
		metas = append(metas, agent.SessionMeta{
			SessionID: c.ID,
			Title:     c.Title,
			CreatedAt: c.CreatedAt,
		})
	}
	return metas, nil
}
