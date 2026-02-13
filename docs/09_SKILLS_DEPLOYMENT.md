# Skills Deployment & Management

## 1. Directory Structure Design

### Production Environment

```
~/.antistudio/
├── antistudio.db           # Database
├── runtimes/               # Embedded runtimes
└── skills/                 # Skills directory
    ├── builtin/            # Built-in skills (installed from app)
    │   ├── code-generator/
    │   ├── test-writer/
    │   └── ...
    └── custom/             # User custom skills
        └── my-skill/
```

### Development Environment

```
project/
├── skills/                 # Development skills (embedded in app)
│   ├── template/
│   └── example-skill/
└── ...
```

## 2. Skills Lifecycle

### 2.1 First Launch (Cold Start)

1. App detects `~/.antistudio/skills/` doesn't exist
2. Creates directory structure
3. Copies built-in skills from embedded resources to `~/.antistudio/skills/builtin/`
4. Marks initialization complete

### 2.2 Subsequent Launches (Warm Start)

1. App loads skills from `~/.antistudio/skills/`
2. Scans both `builtin/` and `custom/` directories
3. No copying needed

### 2.3 App Updates

When app is updated with new skills:
1. Check skill versions
2. Copy new skills to `builtin/` folder
3. Optionally update existing skills (with user confirmation)

## 3. Implementation Strategy

### 3.1 Embed Built-in Skills

Use Go's `embed` directive to bundle skills with the app binary:

```go
//go:embed skills/**/*.md
var builtinSkills embed.FS
```

### 3.2 Skills Manager Service

Create a `SkillManager` service responsible for:
- Initializing skills directory on first run
- Installing built-in skills
- Listing/enabling/disabling skills
- Updating skills
- Loading skills for Agent

### 3.3 Configuration

Store skills configuration:
```json
{
  "skills_version": "1.0.0",
  "last_updated": "2024-01-27T10:00:00Z",
  "disabled_skills": ["skill-name"],
  "skills_path": "~/.antistudio/skills"
}
```

## 4. Skills Metadata

Each skill should have metadata for version management:

```yaml
---
name: code-generator
version: 1.0.0
description: Generates boilerplate code
author: AntiStudio Team
created: 2024-01-27
updated: 2024-01-27
tags: [code, generation]
---
```

## 5. User Experience

### First Launch
```
✓ Initializing AntiStudio...
✓ Creating user directory: ~/.antistudio
✓ Installing 5 built-in skills
  - code-generator
  - test-writer
  - file-manager
  - web-search
  - data-analyzer
✓ Setup complete!
```

### Skills Management (Future UI)
```
Settings > Skills
- Built-in Skills (5)
  ☑ code-generator v1.0.0
  ☑ test-writer v1.0.0
  ☐ web-search v1.0.0 (disabled)

- Custom Skills (1)
  ☑ my-custom-skill

[+ Add Custom Skill]
[Import from URL]
```

## 6. Security Considerations

1. **Verification**: Verify built-in skills checksum
2. **Sandboxing**: User custom skills should be clearly marked
3. **Permissions**: Warn user when enabling custom skills
4. **Code Review**: Built-in skills are reviewed and safe

## 7. Migration Path

For users upgrading from dev builds:
1. Detect old `skills/` in project root
2. Offer to migrate to user directory
3. Copy and preserve user modifications

## 8. Future Enhancements

1. **Skills Marketplace**: Browse and install community skills
2. **Auto-update**: Automatically update built-in skills
3. **Skills Analytics**: Track which skills are most useful
4. **Skills Dependencies**: Allow skills to depend on other skills
5. **Remote Skills**: Load skills from GitHub/URLs
