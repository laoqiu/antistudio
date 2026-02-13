# Skills Guide

## Overview

AntiStudio supports auto-loading skills from the `skills/` directory. Skills are automatically injected into the LLM context as system prompts, allowing the Agent to be aware of and use them.

## How It Works

### 1. Skill Discovery

The `AgentService` automatically scans the `skills/` directory for files named `SKILL.md`. Each skill should be in its own subdirectory:

```
skills/
├── my-skill/
│   └── SKILL.md
├── another-skill/
│   └── SKILL.md
└── template/
    └── SKILL.md
```

### 2. Skill Loading

When a chat session starts, the `loadSkills()` method:
1. Walks through the `skills/` directory
2. Finds all `SKILL.md` files
3. Reads their content
4. Combines them into a single system prompt
5. Injects this prompt as the first message in the LLM context

### 3. Skill Format

Each `SKILL.md` file should follow this format:

```markdown
---
name: skill-name
description: Brief description of what this skill does
---

# Skill Title

## Purpose
Explain what this skill does and why it exists.

## When to Use
Describe the scenarios where the Agent should use this skill.

## Usage
Provide instructions on how to use the skill.

## Example
Show example interactions or code snippets.
```

## Adding a New Skill

### Step 1: Create Directory

```bash
mkdir -p skills/my-new-skill
```

### Step 2: Create SKILL.md

```bash
cat > skills/my-new-skill/SKILL.md << 'EOF'
---
name: my-new-skill
description: Does something useful
---

# My New Skill

## Purpose
This skill helps with...

## When to Use
Use this skill when...

## Usage
To use this skill...

## Example
User: "Do X"
Assistant: "I'll use my-new-skill to..."
EOF
```

### Step 3: Restart Application

The skill will be automatically loaded on the next chat session start. No code changes needed!

## Configuration

### Default Path

By default, skills are loaded from the `skills/` directory relative to the application's working directory.

### Custom Path (For Testing or Development)

You can set a custom skills path programmatically:

```go
agentSvc := service.NewAgentService(repo, llmProvider)
agentSvc.WithSkillsPath("/path/to/custom/skills")
```

## Testing

### Verify Skills Are Loaded

Create a test chat and ask the Agent:

```
User: "What skills do you have access to?"
```

The Agent should list the skills it has loaded from the `skills/` directory.

### Unit Testing

For unit tests, use the `WithSkillsPath()` method to point to a test skills directory:

```go
func TestMyFeature(t *testing.T) {
    svc := service.NewAgentService(repo, llm).WithSkillsPath("../../skills")
    // ... your test code
}
```

## Troubleshooting

### Skills Not Loading

**Problem**: Agent doesn't seem to be aware of skills.

**Solutions**:
1. Verify the `skills/` directory exists in the correct location
2. Ensure each skill has a `SKILL.md` file (exact name, case-sensitive)
3. Check the working directory where the application is running
4. Look for errors in the application logs

### Wrong Working Directory

**Problem**: Skills load in development but not in production.

**Solution**: Make sure the application is started from the project root directory, or use an absolute path:

```go
agentSvc.WithSkillsPath("/absolute/path/to/skills")
```

## Examples

### Example 1: Code Generation Skill

```markdown
---
name: code-generator
description: Generates boilerplate code for common patterns
---

# Code Generator Skill

## Purpose
Quickly generate boilerplate code following project conventions.

## When to Use
- User requests a new component, service, or module
- Need to scaffold standard project structures

## Usage
1. Identify the code pattern requested
2. Generate code following project structure (see docs/07_PROJECT_STRUCTURE.md)
3. Save to appropriate directory
4. Open in Monaco editor for user review

## Example
User: "Create a new LLM provider for Anthropic"
Assistant: "I'll create a new provider in internal/infra/llm/anthropic.go following the LLMProvider interface..."
```

### Example 2: Testing Skill

```markdown
---
name: test-writer
description: Generates unit tests for Go code
---

# Test Writer Skill

## Purpose
Automatically generate comprehensive unit tests for Go code.

## When to Use
- User requests tests for a function or module
- After creating new code that needs test coverage

## Usage
1. Read the target Go file
2. Analyze the functions and their signatures
3. Generate table-driven tests with edge cases
4. Save to `*_test.go` file in the same package

## Example
User: "Write tests for the AgentService.Chat method"
Assistant: "I'll create comprehensive tests including happy path, error cases, and edge conditions..."
```

## Best Practices

1. **Keep Skills Focused**: Each skill should do one thing well
2. **Clear Documentation**: Make it obvious when the skill should be used
3. **Provide Examples**: Show concrete examples of the skill in action
4. **Version Control**: Check your skills into git so they're shared across the team
5. **Naming Convention**: Use kebab-case for skill directory names (e.g., `my-skill`)

## Technical Details

### Implementation

The skill loading logic is in `internal/service/agent.go`:

```go
func (s *AgentService) loadSkills() (string, error)
```

Skills are injected in the `Chat()` method (agent.go:105-111):

```go
skills, err := s.loadSkills()
if err == nil && skills != "" {
    contextMsgs = append(contextMsgs, agent.Message{
        Role:    agent.RoleSystem,
        Content: skills,
    })
}
```

### Performance

- Skills are loaded fresh for each chat session
- Multiple `SKILL.md` files are concatenated with separators
- No caching is performed (can be added if needed for large skill sets)

## Future Enhancements

Potential improvements for the skills system:

1. **Skill Metadata**: Parse YAML frontmatter for better skill management
2. **Skill Discovery API**: Expose loaded skills via API for debugging
3. **Skill Versioning**: Track skill versions and changes
4. **Skill Dependencies**: Allow skills to reference other skills
5. **Dynamic Skills**: Load skills from remote sources or plugins
6. **Skill Analytics**: Track which skills are used most often
