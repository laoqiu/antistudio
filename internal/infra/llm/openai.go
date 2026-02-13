package llm

import (
	"context"
	"errors"
	"io"

	"antistudio/internal/core/agent"
	"antistudio/internal/core/port"

	openai "github.com/sashabaranov/go-openai"
)

// OpenAIProvider implements LLMProvider for OpenAI-compatible APIs
type OpenAIProvider struct {
	client *openai.Client
	model  string
}

// NewOpenAIProvider creates a new provider instance
// baseURL can be empty (defaults to openai.com) or a custom URL (e.g., DeepSeek, Ollama)
func NewOpenAIProvider(apiKey string, baseURL string, model string) port.LLMProvider {
	config := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		config.BaseURL = baseURL
	}
	
	client := openai.NewClientWithConfig(config)
	
	if model == "" {
		model = openai.GPT3Dot5Turbo
	}

	return &OpenAIProvider{
		client: client,
		model:  model,
	}
}

func (p *OpenAIProvider) ID() string {
	return "openai-" + p.model
}

func (p *OpenAIProvider) convertMessages(msgs []agent.Message) []openai.ChatCompletionMessage {
	var openaiMsgs []openai.ChatCompletionMessage
	for _, m := range msgs {
		role := openai.ChatMessageRoleUser
		switch m.Role {
		case agent.RoleSystem:
			role = openai.ChatMessageRoleSystem
		case agent.RoleAssistant:
			role = openai.ChatMessageRoleAssistant
		case agent.RoleTool:
			role = openai.ChatMessageRoleTool
		}
		
		openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{
			Role:    role,
			Content: m.Content,
		})
	}
	return openaiMsgs
}

func (p *OpenAIProvider) Chat(ctx context.Context, messages []agent.Message, options map[string]any) (*agent.Message, error) {
	req := openai.ChatCompletionRequest{
		Model:    p.model,
		Messages: p.convertMessages(messages),
	}

	resp, err := p.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, err
	}

	return &agent.Message{
		Role:             agent.RoleAssistant,
		Content:          resp.Choices[0].Message.Content,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
	}, nil
}

func (p *OpenAIProvider) StreamChat(ctx context.Context, messages []agent.Message, options map[string]any) (<-chan port.StreamChunk, error) {
	req := openai.ChatCompletionRequest{
		Model:    p.model,
		Messages: p.convertMessages(messages),
		Stream:   true,
	}

	stream, err := p.client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		return nil, err
	}

	tokenChan := make(chan port.StreamChunk)

	go func() {
		defer close(tokenChan)
		defer stream.Close()

		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				return
			}
			if err != nil {
				return
			}

			if len(response.Choices) > 0 {
				delta := response.Choices[0].Delta
				
				chunk := port.StreamChunk{
					ContentDelta: delta.Content,
				}
				
				// Optional: Handle Reasoning Content for models that support it
				// go-openai supports this in newer versions or via custom field
				// For standard compatibility, many use 'ReasoningContent'
				// if delta.ReasoningContent != "" {
				//    chunk.ThoughtDelta = delta.ReasoningContent
				// }

				if chunk.ContentDelta != "" || chunk.ThoughtDelta != "" {
					tokenChan <- chunk
				}
			}
		}
	}()

	return tokenChan, nil
}
