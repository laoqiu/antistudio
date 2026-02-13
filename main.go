package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"antistudio/internal/app"
	"antistudio/internal/infra/database"
	"antistudio/internal/infra/llm"
	"antistudio/internal/service"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed skills
var builtinSkills embed.FS

func main() {
	fmt.Println("Starting AntiStudio...")
	// 1. Setup paths
	homeDir, _ := os.UserHomeDir()
	appDir := filepath.Join(homeDir, ".antistudio")
	dbPath := filepath.Join(appDir, "antistudio.db")
	skillsPath := filepath.Join(appDir, "skills")

	// Ensure app directory exists
	if err := os.MkdirAll(appDir, 0755); err != nil {
		log.Fatalf("Failed to create app directory: %v", err)
	}

	// 2. Initialize Skills Manager
	fmt.Println("Initializing AntiStudio...")
	skillManager := service.NewSkillManager(skillsPath, builtinSkills)
	if err := skillManager.Initialize(); err != nil {
		log.Fatalf("Failed to initialize skills: %v", err)
	}

	// List installed skills
	skills, err := skillManager.ListSkills()
	if err != nil {
		log.Printf("Warning: Failed to list skills: %v", err)
	} else {
		fmt.Printf("Loaded %d skill(s)\n", len(skills))
	}

	// 3. Initialize Infrastructure
	repo, err := database.NewSQLiteRepository(dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// 4. Initialize LLM Provider Factory
	llmFactory := llm.NewProviderFactory()

	// Create default provider for backward compatibility
	defaultProvider, err := llmFactory.CreateProvider("gpt-4o")
	if err != nil {
		log.Printf("Warning: Failed to create default LLM provider: %v", err)
		// Use a fallback provider
		apiKey := os.Getenv("LLM_API_KEY")
		defaultProvider = llm.NewOpenAIProvider(apiKey, "https://api.openai.com/v1", "gpt-4o")
	}

	// 5. Initialize Services
	agentSvc := service.NewAgentService(repo, defaultProvider).WithSkillsPath(skillsPath)

	// 6. Initialize API Bindings
	agentAPI := app.NewAgentAPI(agentSvc, llmFactory)
	skillAPI := app.NewSkillAPI(skillManager)

	// Determine frameless based on platform
	// Mac: use native window decorations (traffic lights)
	// Windows: use frameless for custom title bar
	isFrameless := runtime.GOOS == "windows"

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "Antistudio",
		Width:     1200,
		Height:    800,
		Frameless: isFrameless,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			// Wails runtime context is now automatically injected into API methods
			// No need to manually pass context to API objects
			fmt.Println("Application started successfully")
		},
		Bind: []interface{}{
			agentAPI,
			skillAPI,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(), // Hide title bar but keep traffic lights
			Appearance: mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			About: &mac.AboutInfo{
				Title:   "AntiStudio",
				Message: "AI Agent Studio",
			},
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
			Theme:                windows.Dark,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
