# Skills Management System

## Overview

AntiStudio features a robust skills management system that allows:
1. **Built-in Skills**: Pre-packaged skills embedded in the application binary
2. **User Skills**: Custom skills installed by users in their home directory
3. **Auto-loading**: Skills are automatically discovered and injected into LLM context

## Architecture

### Directory Structure

**Production (User's Computer)**
```
~/.antistudio/
├── antistudio.db
├── runtimes/
└── skills/
    ├── builtin/              # Installed from app on first run
    │   ├── code-generator/
    │   │   └── SKILL.md
    │   └── test-writer/
    │       └── SKILL.md
    └── custom/               # User-installed skills
        └── my-skill/
            └── SKILL.md
```

**Development**
```
project/
├── skills/                   # Development skills (embedded in binary)
│   ├── example-skill/
│   │   └── SKILL.md
│   └── template/
│       └── SKILL.md
└── ...
```

## Lifecycle

### First Launch (Cold Start)

1. App checks if `~/.antistudio/skills/` exists
2. If not, creates directory structure:
   - `~/.antistudio/skills/builtin/`
   - `~/.antistudio/skills/custom/`
3. Extracts built-in skills from embedded resources to `builtin/`
4. Creates `.initialized` marker file
5. Loads all skills for use

**Output:**
```
Initializing AntiStudio...
Installing built-in skills...
  ✓ Installed: code-generator
  ✓ Installed: test-writer
✓ Installed 2 built-in skill(s)
Loaded 2 skill(s)
```

### Subsequent Launches (Warm Start)

1. App detects `.initialized` marker
2. Skips installation step
3. Loads skills from `~/.antistudio/skills/`

**Output:**
```
Initializing AntiStudio...
Loaded 2 skill(s)
```

### App Updates with New Skills

When the app is updated with new built-in skills:
1. Check version of installed skills
2. Install new skills to `builtin/`
3. Optionally update existing skills (with user confirmation)

## Components

### 1. SkillManager Service
**File**: `internal/service/skill_manager.go`

**Responsibilities**:
- Initialize skills directory on first run
- Install built-in skills from embedded FS
- List available skills
- Install/remove custom skills
- Manage skill versions

**Key Methods**:
```go
Initialize() error                          // Setup skills directory
InstallBuiltinSkills() error               // Extract embedded skills
ListSkills() ([]SkillInfo, error)         // List all skills
InstallCustomSkill(path string) error     // Install user skill
RemoveCustomSkill(name string) error      // Remove user skill
GetSkillsPath() string                    // Get skills directory
```

### 2. AgentService Integration
**File**: `internal/service/agent.go`

The `AgentService` automatically loads skills on each chat:
```go
skills, err := s.loadSkills()
if err == nil && skills != "" {
    contextMsgs = append(contextMsgs, agent.Message{
        Role:    agent.RoleSystem,
        Content: skills,
    })
}
```

Skills are injected as the first system message in the LLM context.

### 3. Skill API (Frontend Integration)
**File**: `internal/app/skill_api.go`

Exposes skill management to the frontend via Wails:
- `ListSkills()` - Get all skills
- `InstallSkill(path)` - Install a custom skill
- `RemoveSkill(name)` - Remove a custom skill
- `GetSkillsPath()` - Get skills directory path

### 4. Main Application
**File**: `main.go`

Integrates everything:
```go
// Setup paths
skillsPath := filepath.Join(appDir, "skills")

// Initialize skill manager with embedded skills
skillManager := service.NewSkillManager(skillsPath, builtinSkills)
skillManager.Initialize()

// Create agent service with skills path
agentSvc := service.NewAgentService(repo, llmProvider).
    WithSkillsPath(skillsPath)

// Bind APIs to frontend
skillAPI := app.NewSkillAPI(skillManager)
```

## Skill Format

Each skill must have a `SKILL.md` file:

```markdown
---
name: skill-name
version: 1.0.0
description: Brief description
author: Your Name
---

# Skill Title

## Purpose
What this skill does and why it exists.

## When to Use
Scenarios where the Agent should use this skill.

## Usage
Instructions on how to use the skill.

## Example
Example interactions or code.
```

## Development

### Adding Built-in Skills

1. Create skill in `skills/` directory:
   ```bash
   mkdir -p skills/my-new-skill
   ```

2. Create `SKILL.md`:
   ```bash
   vim skills/my-new-skill/SKILL.md
   ```

3. Build the app (skill will be embedded automatically via `//go:embed skills`)

4. On first run, the skill will be installed to user's `~/.antistudio/skills/builtin/`

### Testing Skills

**Unit Tests**: See `internal/service/skill_manager_test.go`

**Integration Tests**: See `internal/service/skill_integration_test.go`

**Demo**: Run the skills management demo:
```bash
go run ./cmd/demo_skills/main.go
```

## User Experience

### Settings UI (Future)

```
┌─ Skills Management ─────────────────────────────┐
│                                                   │
│ Built-in Skills (2)                              │
│   ☑ code-generator    v1.0.0    [Enabled]       │
│   ☑ test-writer       v1.0.0    [Enabled]       │
│                                                   │
│ Custom Skills (1)                                │
│   ☑ my-custom-skill   v1.0.0    [Enabled]       │
│                                     [Remove]      │
│                                                   │
│ [+ Add Custom Skill]  [Browse Marketplace]       │
│                                                   │
│ Skills Directory:                                │
│ ~/.antistudio/skills/                [Open]      │
└───────────────────────────────────────────────────┘
```

### CLI (Future)

```bash
# List skills
antistudio skills list

# Install skill
antistudio skills install ./my-skill

# Remove skill
antistudio skills remove my-skill

# Open skills directory
antistudio skills open
```

## Security

### Built-in Skills
- ✓ Reviewed and approved by AntiStudio team
- ✓ Embedded in signed application binary
- ✓ Checksum verification on installation

### Custom Skills
- ⚠️ User-provided, not reviewed
- ⚠️ Clearly marked in UI
- ⚠️ User responsible for content

### Best Practices
1. Review custom skills before installation
2. Only install skills from trusted sources
3. Check skill metadata (author, version)
4. Monitor skill behavior in chat logs

## Migration

### From Development Build

If users have been using development builds with skills in project root:

1. Detect old `./skills` directory
2. Offer to migrate to `~/.antistudio/skills/custom/`
3. Copy skills preserving structure
4. Mark as custom skills

## Future Enhancements

### Phase 2: Marketplace
- Browse community-created skills
- Rate and review skills
- One-click installation from URL
- Auto-update mechanism

### Phase 3: Advanced Features
- Skill dependencies (skill A requires skill B)
- Skill permissions and sandboxing
- Skill analytics (usage tracking)
- Remote skills (load from GitHub/URLs)
- Skill templates and generators
- Multi-language skills (Python, JS skills)

### Phase 4: Enterprise
- Organization skill repositories
- Centralized skill management
- Compliance and security scanning
- Skill versioning and rollback
- A/B testing of skills

## Troubleshooting

### Skills Not Loading

**Problem**: Agent doesn't seem aware of skills

**Solutions**:
1. Check if skills directory exists: `ls ~/.antistudio/skills`
2. Verify SKILL.md files: `find ~/.antistudio/skills -name "SKILL.md"`
3. Check app logs for errors
4. Try re-initialization: Delete `~/.antistudio/skills/.initialized` and restart

### Custom Skill Won't Install

**Problem**: `InstallCustomSkill()` fails

**Common Causes**:
1. Missing `SKILL.md` in source directory
2. Skill with same name already exists
3. Permission issues on `~/.antistudio/`

**Solutions**:
```bash
# Verify SKILL.md exists
ls /path/to/skill/SKILL.md

# Check for duplicate
ls ~/.antistudio/skills/custom/

# Fix permissions
chmod -R 755 ~/.antistudio/
```

### Skills Directory in Wrong Location

**Problem**: Skills installed to wrong path

**Solution**: Set explicit path in code:
```go
skillsPath := filepath.Join(homeDir, ".antistudio", "skills")
skillManager.Initialize()
```

## API Reference

### Go API

```go
// Create manager
sm := service.NewSkillManager(userSkillsPath, embeddedSkills)

// Initialize (first run)
err := sm.Initialize()

// List skills
skills, err := sm.ListSkills()

// Install custom skill
err := sm.InstallCustomSkill("/path/to/skill")

// Remove skill
err := sm.RemoveCustomSkill("skill-name")

// Get path
path := sm.GetSkillsPath()
```

### Frontend API (Wails)

```typescript
// Import from generated bindings
import { ListSkills, InstallSkill, RemoveSkill } from '../wailsjs/go/app/SkillAPI'

// List skills
const skills = await ListSkills()

// Install skill
await InstallSkill("/path/to/skill")

// Remove skill
await RemoveSkill("skill-name")
```

## Documentation

- Architecture: `docs/01_ARCHITECTURE.md`
- Skills Guide: `docs/08_SKILLS_GUIDE.md`
- Deployment: `docs/09_SKILLS_DEPLOYMENT.md`
- This README: `SKILLS_README.md`
