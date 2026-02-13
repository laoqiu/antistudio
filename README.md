# AntiStudio

**Local-first Agent Orchestration Client**

A desktop application for managing and orchestrating AI agents with a focus on local-first architecture, streaming interactions, and extensible skills system.

## 🚀 Features

- **🤖 Agent Chat** - Streaming chat interface with real-time updates
- **🧠 Thinking Process** - View agent's reasoning in collapsible blocks
- **🔧 Skills System** - Auto-loading skills from filesystem, built-in and custom
- **💾 Local-first** - All data stored locally with Turso/SQLite
- **🎨 Modern UI** - React 18 + MobX + TailwindCSS
- **⚡ Fast** - Golang backend with Wails v2 desktop integration
- **📝 Code Preview** - Monaco editor for code display
- **💻 Terminal** - Embedded xterm.js terminal

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Getting Started](docs/README.md)** - Documentation index and quick start
- **[Architecture](docs/01_ARCHITECTURE.md)** - System design and components
- **[Frontend Development](docs/06_FRONTEND_SPEC.md)** - Frontend tech stack and specs
- **[Skills Guide](docs/08_SKILLS_GUIDE.md)** - How to use and create skills
- **[Testing Guide](docs/11_TESTING_GUIDE.md)** - Running and writing tests

See [`docs/README.md`](docs/README.md) for complete documentation index.

## 🛠️ Tech Stack

### Backend
- **Go 1.24** - Backend language
- **Wails v2** - Desktop framework
- **Turso/libSQL** - Local database
- **OpenAI-compatible LLM** - AI provider (OpenAI, DeepSeek, etc.)

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **MobX 6** - State management
- **TailwindCSS** - Styling
- **Monaco Editor** - Code display
- **xterm.js** - Terminal emulator
- **Vite** - Build tool

## 📦 Installation

### Prerequisites
- Go 1.24 or later
- Node.js 18 or later
- Yarn package manager

### Install Dependencies

```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Install Go dependencies
go mod download

# Install frontend dependencies
cd frontend
yarn install
cd ..
```

## 🏃 Development

### Live Development Mode

```bash
# Run with hot reload
wails dev
```

This starts:
- Go backend with live reload
- Vite dev server for frontend
- Browser access at http://localhost:34115

### Frontend Only Development

```bash
cd frontend
yarn dev
```

### Running Tests

```bash
# All tests
go test ./internal/...

# With coverage
go test ./internal/... -cover

# Generate coverage report
go test ./internal/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

See [Testing Guide](docs/11_TESTING_GUIDE.md) for more options.

## 📦 Building

### Build for Current Platform

```bash
wails build
```

### Build for Specific Platform

```bash
# macOS
wails build -platform darwin/universal

# Windows
wails build -platform windows/amd64

# Linux
wails build -platform linux/amd64
```

Binary will be created in `build/bin/`.

## 🎯 Project Status

| Component | Status | Coverage |
|-----------|--------|----------|
| Backend Core | ✅ Complete | 100% |
| Service Layer | ✅ Complete | 73.6% |
| LLM Integration | ✅ Complete | 59.5% |
| Skills System | ✅ Complete | 100% |
| Frontend Architecture | ✅ Complete | - |
| Frontend UI | 🔄 In Progress | - |
| Database | ✅ Complete | Integration tests |

**Overall Test Coverage**: 58.2%

See [Frontend Readiness Assessment](docs/13_FRONTEND_READINESS_ASSESSMENT.md) for detailed status.

## 📂 Project Structure

```
antistudio/
├── cmd/                    # Command line tools
├── internal/               # Internal packages (DDD architecture)
│   ├── core/              # Domain entities
│   │   ├── agent/         # Agent domain models
│   │   └── port/          # Interface definitions
│   ├── service/           # Business logic
│   │   ├── agent.go       # Agent service
│   │   └── skill_manager.go
│   ├── infra/             # Infrastructure
│   │   ├── llm/           # LLM providers
│   │   └── database/      # Database repositories
│   └── app/               # Application layer (Wails APIs)
│       ├── agent_api.go   # Agent API for frontend
│       └── skill_api.go   # Skills API
├── frontend/              # React frontend
│   └── src/
│       ├── components/    # React components
│       ├── stores/        # MobX stores
│       ├── hooks/         # Custom hooks
│       ├── types/         # TypeScript types
│       └── lib/           # Utilities
├── skills/                # Built-in skills (embedded in binary)
├── docs/                  # Documentation
└── wails.json            # Wails configuration
```

See [Project Structure](docs/07_PROJECT_STRUCTURE.md) for details.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# LLM Provider
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo

# Database
DB_PATH=~/.antistudio/data.db

# Skills
SKILLS_PATH=~/.antistudio/skills
```

### Skills Directory

On first run, built-in skills are automatically extracted to:
- **macOS/Linux**: `~/.antistudio/skills/builtin/`
- **Windows**: `%USERPROFILE%\.antistudio\skills\builtin\`

Custom skills can be added to:
- `~/.antistudio/skills/custom/`

See [Skills Deployment Guide](docs/09_SKILLS_DEPLOYMENT.md).

## 🤝 Contributing

Contributions are welcome! Please:

1. Read the [Architecture Documentation](docs/01_ARCHITECTURE.md)
2. Check [Project Status](docs/13_FRONTEND_READINESS_ASSESSMENT.md)
3. Follow existing code patterns
4. Add tests for new features
5. Update documentation

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

Built with:
- [Wails](https://wails.io/) - Desktop application framework
- [Go](https://golang.org/) - Backend language
- [React](https://react.dev/) - UI framework
- [MobX](https://mobx.js.org/) - State management
- [Turso](https://turso.tech/) - libSQL database

---

**Version**: 0.1.0 (MVP)
**Last Updated**: 2026-01-27

For detailed documentation, see [`docs/README.md`](docs/README.md).
