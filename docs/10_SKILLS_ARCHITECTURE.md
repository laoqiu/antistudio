# Skills System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AntiStudio App                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐     ┌──────────────┐    ┌────────────┐     │
│  │  Frontend  │────▶│   Skill API  │────▶│   Skill    │     │
│  │   (React)  │     │   (Wails)    │     │  Manager   │     │
│  └────────────┘     └──────────────┘    └─────┬──────┘     │
│                                                 │            │
│                          ┌──────────────────────┘            │
│                          ▼                                   │
│                    ┌─────────────┐                          │
│                    │   Agent     │                          │
│                    │   Service   │                          │
│                    └─────┬───────┘                          │
│                          │                                   │
│                          │ loadSkills()                     │
│                          ▼                                   │
│                  ┌───────────────┐                          │
│                  │  LLM Context  │                          │
│                  │  (w/ Skills)  │                          │
│                  └───────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Read from
                           ▼
        ┌─────────────────────────────────────┐
        │    User Home Directory               │
        │    ~/.antistudio/skills/            │
        ├─────────────────────────────────────┤
        │  builtin/                           │
        │    ├── code-generator/              │
        │    │   └── SKILL.md                 │
        │    └── test-writer/                 │
        │        └── SKILL.md                 │
        │  custom/                            │
        │    └── my-skill/                    │
        │        └── SKILL.md                 │
        └─────────────────────────────────────┘
                           ▲
                           │ Installed from
                           │
        ┌─────────────────────────────────────┐
        │    Application Binary                │
        │    (Embedded Skills)                 │
        ├─────────────────────────────────────┤
        │  //go:embed skills                  │
        │    ├── example-skill/               │
        │    │   └── SKILL.md                 │
        │    └── template/                    │
        │        └── SKILL.md                 │
        └─────────────────────────────────────┘
```

## Component Interaction

### First Launch Flow

```
┌─────────┐
│  main   │
└────┬────┘
     │
     │ 1. Create SkillManager
     ▼
┌─────────────────┐
│  SkillManager   │
├─────────────────┤
│ Initialize()    │◀─── Check ~/.antistudio/skills/
└────┬────────────┘
     │ Not found
     │
     │ 2. Create directories
     ▼
┌─────────────────────┐
│  builtin/  custom/  │
└──────────┬──────────┘
           │
           │ 3. Install built-in skills
           ▼
┌─────────────────────────┐
│  Extract from embed.FS  │
│  Copy to builtin/       │
└──────────┬──────────────┘
           │
           │ 4. Create marker
           ▼
┌─────────────────────┐
│  .initialized       │
└─────────────────────┘
```

### Chat Session Flow

```
┌────────────┐
│ User Input │
└─────┬──────┘
      │
      ▼
┌─────────────┐
│ AgentService│
│   Chat()    │
└─────┬───────┘
      │
      │ 1. Load skills
      ▼
┌──────────────────┐
│   loadSkills()   │
├──────────────────┤
│ Walk directory   │
│ Find SKILL.md    │
│ Read & concat    │
└─────┬────────────┘
      │
      │ 2. Build context
      ▼
┌────────────────────────┐
│  contextMsgs = [       │
│    {                   │
│      Role: System,     │
│      Content: skills   │ ◀── Skills injected here
│    },                  │
│    ...history...       │
│  ]                     │
└─────┬──────────────────┘
      │
      │ 3. Send to LLM
      ▼
┌────────────────┐
│  LLM Provider  │
│  StreamChat()  │
└────────────────┘
```

## Data Flow

### Skill Installation

```
Development                   Production
    │                             │
    │ Build Time                  │ Runtime
    ▼                             ▼
┌──────────┐  Embed        ┌──────────────┐
│ skills/  │─────────────▶ │ Application  │
│  ├─ foo/ │               │ Binary       │
│  └─ bar/ │               │ (embed.FS)   │
└──────────┘               └──────┬───────┘
                                  │
                      First Run   │
                                  ▼
                        ┌─────────────────────┐
                        │ ~/.antistudio/      │
                        │   skills/builtin/   │
                        │     ├─ foo/         │
                        │     └─ bar/         │
                        └─────────────────────┘
```

### Custom Skill Installation

```
User's Computer
┌────────────────┐
│ /tmp/my-skill/ │
│   └─ SKILL.md  │
└────────┬───────┘
         │
         │ User Action
         │ (via UI or API)
         ▼
┌──────────────────┐
│ SkillAPI         │
│ InstallSkill()   │
└────────┬─────────┘
         │
         │ Validate
         │ (check SKILL.md)
         ▼
┌─────────────────────┐
│ SkillManager        │
│ InstallCustomSkill()│
└────────┬────────────┘
         │
         │ Copy
         ▼
┌───────────────────────┐
│ ~/.antistudio/        │
│   skills/custom/      │
│     └─ my-skill/      │
│         └─ SKILL.md   │
└───────────────────────┘
```

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                   │
│  ┌─────────────┐      ┌─────────────┐      │
│  │  AgentAPI   │      │  SkillAPI   │      │
│  └─────────────┘      └─────────────┘      │
└────────────┬──────────────────┬─────────────┘
             │                  │
┌────────────┴──────────────────┴─────────────┐
│         Application Layer                    │
│  ┌──────────────┐    ┌──────────────┐      │
│  │ AgentService │    │ SkillManager │      │
│  └──────────────┘    └──────────────┘      │
└────────────┬──────────────────┬─────────────┘
             │                  │
┌────────────┴──────────────────┴─────────────┐
│         Infrastructure Layer                 │
│  ┌──────────────┐    ┌──────────────┐      │
│  │ LLMProvider  │    │ FileSystem   │      │
│  └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────┘
             │                  │
             ▼                  ▼
      ┌──────────┐      ┌──────────────┐
      │   LLM    │      │ embed.FS     │
      └──────────┘      │ ~/.antistudio│
                        └──────────────┘
```

## State Machine

### Skill Installation State

```
           ┌─────────────┐
           │  Not Exists │
           └──────┬──────┘
                  │
        Initialize()
                  │
                  ▼
         ┌────────────────┐
         │  Initializing  │
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         │                 │
    Success           Failure
         │                 │
         ▼                 ▼
  ┌─────────────┐   ┌───────────┐
  │ Initialized │   │   Error   │
  └──────┬──────┘   └───────────┘
         │
         │ Warm Start
         │
         ▼
  ┌─────────────┐
  │   Loaded    │
  └─────────────┘
```

### Custom Skill State

```
  ┌──────────────┐
  │ Not Installed│
  └──────┬───────┘
         │
    Install()
         │
         ▼
  ┌──────────────┐
  │  Installing  │
  └──────┬───────┘
         │
    ┌────┴─────┐
    │          │
Success     Failure
    │          │
    ▼          ▼
┌─────────┐ ┌───────┐
│Installed│ │ Error │
└────┬────┘ └───────┘
     │
     │ Remove()
     │
     ▼
┌──────────┐
│ Removing │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Removed  │
└──────────┘
```

## Threading Model

```
Main Thread
    │
    ├─▶ Initialize SkillManager (Blocking)
    │   └─▶ Extract skills from embed.FS
    │
    ├─▶ Create AgentService
    │
    └─▶ Start Wails App
            │
            └─▶ UI Thread
                    │
                    ├─▶ User sends message
                    │   │
                    │   └─▶ Goroutine: AgentService.Chat()
                    │       │
                    │       ├─▶ loadSkills() (I/O)
                    │       │
                    │       ├─▶ StreamChat() (Network)
                    │       │
                    │       └─▶ Emit updates (Channel)
                    │
                    └─▶ User manages skills
                        │
                        └─▶ SkillAPI calls (Blocking)
                            │
                            ├─▶ InstallSkill() (I/O)
                            ├─▶ RemoveSkill() (I/O)
                            └─▶ ListSkills() (I/O)
```

## Security Boundaries

```
┌─────────────────────────────────────────────┐
│           Trusted Zone                       │
│  ┌─────────────────────────────────────┐   │
│  │ Application Binary (Signed)         │   │
│  │   └─ Embedded Built-in Skills       │   │
│  └─────────────────────────────────────┘   │
│                    │                         │
│                    │ Extract (Checksum)      │
│                    ▼                         │
│  ┌─────────────────────────────────────┐   │
│  │ ~/.antistudio/skills/builtin/       │   │
│  │   (App-provided, verified)          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     ∥ Boundary
┌─────────────────────────────────────────────┐
│         Untrusted Zone                       │
│  ┌─────────────────────────────────────┐   │
│  │ ~/.antistudio/skills/custom/        │   │
│  │   (User-provided, unverified)       │   │
│  │   ⚠️  Requires user awareness       │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Error Handling

```
┌──────────────┐
│  Operation   │
└──────┬───────┘
       │
   Try Execute
       │
   ┌───┴────┐
   │        │
Success  Failure
   │        │
   │        ├─▶ os.IsNotExist() ────▶ Create & Retry
   │        │
   │        ├─▶ Permission Error ───▶ Log & Return Error
   │        │
   │        └─▶ Other Error ────────▶ Log & Return Error
   │
   ▼
┌───────┐
│ Done  │
└───────┘
```

## Performance Considerations

### Cold Start (First Launch)
```
Time: ~100-500ms
- Directory creation: ~10ms
- Extract embedded skills: ~50-200ms (depends on size)
- Write to disk: ~40-100ms
- Create marker: ~10ms
```

### Warm Start (Subsequent)
```
Time: ~10-50ms
- Check .initialized: ~5ms
- Scan directory: ~5-20ms (depends on # of skills)
- Read SKILL.md files: ~10-30ms
```

### Per Chat Session
```
Time: ~5-20ms (added to first message)
- Walk directory: ~3-10ms
- Read files: ~2-10ms
- Concatenate: ~1ms
```

## Scalability

### Current Limits
- Built-in skills: 10-20 (embedded in binary)
- Custom skills: 100+ (user directory)
- Skill size: ~10KB per SKILL.md (recommended)
- Total context: ~100KB skills content (stays within token limits)

### Optimization Strategies
1. **Lazy Loading**: Load skills only when needed
2. **Caching**: Cache parsed skills in memory
3. **Selective Loading**: Only load enabled skills
4. **Compression**: Compress embedded skills
5. **Indexing**: Build skill index for fast lookup

## Monitoring Points

```
┌─────────────────┐
│ Instrumentation │
└────────┬────────┘
         │
    ┌────┴─────┬────────┬──────────┐
    │          │        │          │
    ▼          ▼        ▼          ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────────┐
│ Init   │ │ Load │ │ Chat │ │ Install/ │
│ Time   │ │ Time │ │ Time │ │ Remove   │
└────────┘ └──────┘ └──────┘ └──────────┘
    │          │        │          │
    └──────────┴────────┴──────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   Metrics API   │
         │  (Future)        │
         └─────────────────┘
```

## References

- System Architecture: `docs/01_ARCHITECTURE.md`
- Data Model: `docs/03_DATA_MODEL.md`
- Project Structure: `docs/07_PROJECT_STRUCTURE.md`
- Skills Guide: `docs/08_SKILLS_GUIDE.md`
- Deployment: `docs/09_SKILLS_DEPLOYMENT.md`
