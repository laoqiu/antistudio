# AntiStudio Documentation

Complete documentation for AntiStudio - Local-first Agent Orchestration Client.

## 📚 Documentation Index

### Architecture & Design (01-07)

- **[01_ARCHITECTURE.md](01_ARCHITECTURE.md)** - System architecture overview (Golang + Wails + React)
- **[02_A2UI_PROTOCOL.md](02_A2UI_PROTOCOL.md)** - Agent-to-UI communication protocol
- **[03_DATA_MODEL.md](03_DATA_MODEL.md)** - Database schema and data models
- **[04_WORKFLOW_SPEC.md](04_WORKFLOW_SPEC.md)** - Workflow DAG structure specification
- **[05_MVP_SCOPE.md](05_MVP_SCOPE.md)** - MVP technical scope and features
- **[06_FRONTEND_SPEC.md](06_FRONTEND_SPEC.md)** - Frontend technical specification
- **[07_PROJECT_STRUCTURE.md](07_PROJECT_STRUCTURE.md)** - Project directory structure

### Skills System (08-10, 15-18)

- **[08_SKILLS_GUIDE.md](08_SKILLS_GUIDE.md)** - Skills usage guide
- **[09_SKILLS_DEPLOYMENT.md](09_SKILLS_DEPLOYMENT.md)** - Production deployment strategy
- **[10_SKILLS_ARCHITECTURE.md](10_SKILLS_ARCHITECTURE.md)** - Skills system architecture
- **[15_SKILLS_README.md](15_SKILLS_README.md)** - Complete skills documentation
- **[16_SKILLS_IMPLEMENTATION_SUMMARY.md](16_SKILLS_IMPLEMENTATION_SUMMARY.md)** - Implementation details
- **[17_SKILLS_QUICK_REFERENCE.md](17_SKILLS_QUICK_REFERENCE.md)** - Quick reference card
- **[18_SKILLS_VERIFICATION_CHECKLIST.md](18_SKILLS_VERIFICATION_CHECKLIST.md)** - Verification checklist

### Testing (11-12)

- **[11_TESTING_GUIDE.md](11_TESTING_GUIDE.md)** - How to run and write tests
- **[12_TEST_COVERAGE_REPORT.md](12_TEST_COVERAGE_REPORT.md)** - Test coverage analysis

### Frontend (13-14)

- **[13_FRONTEND_READINESS_ASSESSMENT.md](13_FRONTEND_READINESS_ASSESSMENT.md)** - Frontend readiness evaluation
- **[14_FRONTEND_ARCHITECTURE_IMPLEMENTATION.md](14_FRONTEND_ARCHITECTURE_IMPLEMENTATION.md)** - Frontend architecture implementation

### Refactoring & Technical Debt (19-21)

- **[19_CORE_LAYER_REFACTORING.md](19_CORE_LAYER_REFACTORING.md)** - Core layer refactoring to remove json.RawMessage
- **[20_WAILS_CONTEXT_INJECTION.md](20_WAILS_CONTEXT_INJECTION.md)** - Fix Wails context injection and serialization
- **[21_WAILS_API_REDESIGN.md](21_WAILS_API_REDESIGN.md)** - Complete API redesign for Wails compatibility

## 🔄 最近更新 (2026-01-27)

- **[../BACKEND_REFACTORING_SUMMARY.md](../BACKEND_REFACTORING_SUMMARY.md)** - 后端重大重构总结
  - 数据库层重写（原生 SQL 替代 xorm）
  - LLM Provider Factory 实现
  - 多模型支持（GPT-4, DeepSeek, Claude）
  - Wails App 结构说明

- **[../WAILS_API_FIX_SUMMARY.md](../WAILS_API_FIX_SUMMARY.md)** - Wails API 修复总结（中文）

## 🚀 Quick Start

### For Developers

1. **Understand the Architecture**
   - Start with [01_ARCHITECTURE.md](01_ARCHITECTURE.md)
   - Read [07_PROJECT_STRUCTURE.md](07_PROJECT_STRUCTURE.md)

2. **Backend Development**
   - Review [02_A2UI_PROTOCOL.md](02_A2UI_PROTOCOL.md)
   - Check [03_DATA_MODEL.md](03_DATA_MODEL.md)
   - Run tests per [11_TESTING_GUIDE.md](11_TESTING_GUIDE.md)

3. **Frontend Development**
   - Read [06_FRONTEND_SPEC.md](06_FRONTEND_SPEC.md)
   - Check [14_FRONTEND_ARCHITECTURE_IMPLEMENTATION.md](14_FRONTEND_ARCHITECTURE_IMPLEMENTATION.md)
   - See `frontend/README.md` for detailed frontend docs

4. **Skills Development**
   - Quick start: [17_SKILLS_QUICK_REFERENCE.md](17_SKILLS_QUICK_REFERENCE.md)
   - Full guide: [15_SKILLS_README.md](15_SKILLS_README.md)
   - Architecture: [10_SKILLS_ARCHITECTURE.md](10_SKILLS_ARCHITECTURE.md)

### For Users

1. **Skills Usage**
   - [08_SKILLS_GUIDE.md](08_SKILLS_GUIDE.md) - How to use skills
   - [17_SKILLS_QUICK_REFERENCE.md](17_SKILLS_QUICK_REFERENCE.md) - Quick reference

## 📊 Project Status

- **Backend**: 70% complete ✅
- **Frontend**: 20% complete 🔄
- **Skills System**: 100% complete ✅
- **Test Coverage**: 58.2% 🟡
- **Documentation**: Comprehensive ✅

See [13_FRONTEND_READINESS_ASSESSMENT.md](13_FRONTEND_READINESS_ASSESSMENT.md) for detailed status.

## 🔧 Development Workflow

### Running Tests
```bash
# All tests
go test ./internal/...

# With coverage
go test ./internal/... -cover

# Generate HTML report
go test ./internal/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

See [11_TESTING_GUIDE.md](11_TESTING_GUIDE.md) for more options.

### Building
```bash
# Development
wails dev

# Production
wails build
```

### Skills Management
```bash
# Skills are automatically installed on first run
# Custom skills go in: ~/.antistudio/skills/custom/
```

See [09_SKILLS_DEPLOYMENT.md](09_SKILLS_DEPLOYMENT.md) for deployment details.

## 📝 Documentation Standards

All documentation follows these conventions:

- **Numbered files (01-18)**: Core documentation, read in order for complete understanding
- **Markdown format**: GitHub-flavored markdown
- **Code examples**: Include working code snippets
- **Diagrams**: Use ASCII art or mermaid syntax
- **Status indicators**: ✅ Complete, 🔄 In Progress, 🔴 Blocked, 🟡 Needs Work

## 🤝 Contributing

When adding new documentation:

1. Use the next available number (19_YOUR_DOC.md)
2. Update this README.md index
3. Follow existing formatting conventions
4. Include practical examples
5. Add cross-references to related docs

## 📖 Additional Resources

- **Main README**: `../README.md` (project root)
- **Frontend README**: `../frontend/README.md`
- **Skills Template**: `../skills/template/SKILL.md`
- **Test Coverage Report**: [12_TEST_COVERAGE_REPORT.md](12_TEST_COVERAGE_REPORT.md)

---

**Last Updated**: 2026-01-27
**Documentation Version**: 1.0
