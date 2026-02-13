# Skills Quick Reference Card

## 📍 Locations

```
Development:  ./skills/
Production:   ~/.antistudio/skills/
              ├── builtin/     (app-provided)
              └── custom/      (user-installed)
```

## 🚀 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| SkillManager | `internal/service/skill_manager.go` | Manages skill lifecycle |
| AgentService | `internal/service/agent.go` | Loads and injects skills |
| SkillAPI | `internal/app/skill_api.go` | Frontend API |
| Main | `main.go` | Initialization |

## 📝 Quick Commands

### Development
```bash
# Add new built-in skill
mkdir -p skills/my-skill
vim skills/my-skill/SKILL.md

# Run tests
go test ./internal/service/...

# Run demo
go run ./cmd/demo_skills/main.go

# Build (skills auto-embedded)
go build
```

### Testing
```bash
# Test specific feature
go test ./internal/service -run TestSkillManager

# Test skill loading
go test ./internal/service -run TestSkillsAreInjected

# Test with verbose output
go test -v ./internal/service/...
```

## 🔧 Code Snippets

### Using SkillManager
```go
// Create
sm := service.NewSkillManager(userPath, embeddedSkills)

// Initialize
sm.Initialize()

// List
skills, _ := sm.ListSkills()

// Install custom
sm.InstallCustomSkill("/path/to/skill")

// Remove
sm.RemoveCustomSkill("skill-name")
```

### Configuring AgentService
```go
skillsPath := filepath.Join(homeDir, ".antistudio", "skills")
agentSvc := service.NewAgentService(repo, llm).
    WithSkillsPath(skillsPath)
```

## 📄 Skill Format

```markdown
---
name: skill-name
version: 1.0.0
description: Brief description
author: Your Name
---

# Skill Title

## Purpose
What it does

## When to Use
When to use it

## Usage
How to use it

## Example
Example usage
```

## 🎯 Lifecycle

```
First Launch:
  Check dir → Create → Install builtin → Load

Subsequent:
  Check marker → Skip install → Load

Chat Session:
  Scan dir → Read SKILL.md → Inject context
```

## ✅ Checklist

### For New Built-in Skill
- [ ] Create `skills/[name]/SKILL.md`
- [ ] Add proper metadata (name, version, description)
- [ ] Document purpose and usage
- [ ] Test with agent
- [ ] Build app (auto-embedded)

### For Custom Skill
- [ ] Create directory with `SKILL.md`
- [ ] Test locally
- [ ] Copy to `~/.antistudio/skills/custom/`
- [ ] Verify in agent chat

## 📊 Test Coverage

```
✓ SkillManager initialization
✓ Built-in skill installation
✓ Custom skill installation/removal
✓ Skill listing
✓ Agent integration
✓ Path configuration
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Skills not loading | Check `~/.antistudio/skills/` exists |
| Missing SKILL.md | Verify file name (case-sensitive) |
| Install fails | Check permissions on `~/.antistudio/` |
| Agent unaware | Verify skills in system message |

## 📚 Documentation Links

- Full Guide: `SKILLS_README.md`
- Implementation: `SKILLS_IMPLEMENTATION_SUMMARY.md`
- Architecture: `docs/01_ARCHITECTURE.md`
- Skills Guide: `docs/08_SKILLS_GUIDE.md`
- Deployment: `docs/09_SKILLS_DEPLOYMENT.md`

## 🔮 Coming Soon

- [ ] UI for skill management
- [ ] Skill marketplace
- [ ] Remote installation
- [ ] Version management
- [ ] Skill dependencies
- [ ] Usage analytics

---
**Last Updated**: 2026-01-27
**Version**: 1.0.0
