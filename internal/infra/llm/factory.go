package llm

import (
	"fmt"
	"os"

	"antistudio/internal/core/port"
)

// ProviderFactory creates LLM providers based on model name
type ProviderFactory struct {
	apiKey  string
	baseURL string
}

// NewProviderFactory creates a new provider factory
func NewProviderFactory() *ProviderFactory {
	return &ProviderFactory{
		apiKey:  os.Getenv("LLM_API_KEY"),
		baseURL: os.Getenv("LLM_BASE_URL"),
	}
}

// CreateProvider creates an LLM provider for the specified model
func (f *ProviderFactory) CreateProvider(model string) (port.LLMProvider, error) {
	// Determine provider and base URL based on model name
	switch {
	case isOpenAIModel(model):
		return f.createOpenAIProvider(model)
	case isDeepSeekModel(model):
		return f.createDeepSeekProvider(model)
	case isClaudeModel(model):
		return f.createClaudeProvider(model)
	case isGLMModel(model):
		return f.createGLMProvider(model)
	default:
		return nil, fmt.Errorf("unsupported model: %s", model)
	}
}

// createOpenAIProvider creates OpenAI provider
func (f *ProviderFactory) createOpenAIProvider(model string) (port.LLMProvider, error) {
	apiKey := f.apiKey
	if apiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY not set")
	}

	baseURL := f.baseURL
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}

	return NewOpenAIProvider(apiKey, baseURL, model), nil
}

// createDeepSeekProvider creates DeepSeek provider
func (f *ProviderFactory) createDeepSeekProvider(model string) (port.LLMProvider, error) {
	apiKey := f.apiKey
	if apiKey == "" {
		return nil, fmt.Errorf("DEEPSEEK_API_KEY not set")
	}

	baseURL := "https://api.deepseek.com/v1"

	return NewOpenAIProvider(apiKey, baseURL, model), nil
}

// createClaudeProvider creates Claude provider (via OpenAI-compatible API)
func (f *ProviderFactory) createClaudeProvider(model string) (port.LLMProvider, error) {
	apiKey := f.apiKey
	if apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY not set")
	}

	// If using OpenRouter or similar proxy
	baseURL := f.baseURL
	if baseURL == "" {
		return nil, fmt.Errorf("ANTHROPIC_BASE_URL not set for Claude models")
	}

	return NewOpenAIProvider(apiKey, baseURL, model), nil
}

// createGLMProvider creates GLM/ZhipuAI provider (OpenAI-compatible)
func (f *ProviderFactory) createGLMProvider(model string) (port.LLMProvider, error) {
	apiKey := f.apiKey
	if apiKey == "" {
		return nil, fmt.Errorf("GLM_API_KEY not set")
	}

	baseURL := "https://open.bigmodel.cn/api/paas/v4"

	return NewOpenAIProvider(apiKey, baseURL, model), nil
}

// Model detection helpers
func isOpenAIModel(model string) bool {
	models := []string{"gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", "gpt-3.5"}
	for _, m := range models {
		if model == m {
			return true
		}
	}
	return false
}

func isDeepSeekModel(model string) bool {
	models := []string{"deepseek-chat", "deepseek-coder"}
	for _, m := range models {
		if model == m {
			return true
		}
	}
	return false
}

func isClaudeModel(model string) bool {
	models := []string{"claude-3-opus", "claude-3-sonnet", "claude-3-haiku"}
	for _, m := range models {
		if model == m {
			return true
		}
	}
	return false
}

func isGLMModel(model string) bool {
	models := []string{"glm-4", "glm-4v", "glm-3-turbo"}
	for _, m := range models {
		if model == m {
			return true
		}
	}
	return false
}

// GetSupportedModels returns list of supported models
func GetSupportedModels() []string {
	return []string{
		"gpt-4o",
		"gpt-4-turbo",
		"gpt-4",
		"gpt-3.5-turbo",
		"deepseek-chat",
		"deepseek-coder",
		"claude-3-opus",
		"claude-3-sonnet",
		"claude-3-haiku",
		"glm-4",
		"glm-4v",
		"glm-3-turbo",
	}
}
