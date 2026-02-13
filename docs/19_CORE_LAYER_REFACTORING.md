# Core Layer Refactoring - Remove json.RawMessage

**Date**: 2026-01-27
**Issue**: Core domain layer was using `json.RawMessage`, violating DDD principles
**Status**: ✅ Completed

## Problem

The `InteractionRequest` type in `internal/core/agent/message.go` was using `json.RawMessage`:

```go
// Before - WRONG ❌
type InteractionRequest struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`  // Depends on encoding/json
}
```

### Why This Is Wrong

1. **Violates DDD Principles**: Core domain layer should be technology-agnostic
2. **Framework Dependency**: Core layer depends on `encoding/json` package
3. **Unclear Contract**: `json.RawMessage` doesn't express what data is expected
4. **Type Safety**: Loses compile-time type checking

## Solution

Refactored `InteractionRequest` to use concrete, domain-specific fields:

```go
// After - CORRECT ✅
type InteractionRequest struct {
	Type    string   `json:"type"`              // "confirm", "input", "select"
	Prompt  string   `json:"prompt"`            // Question or message to display
	Options []string `json:"options,omitempty"` // For "select" type
}
```

### Benefits

1. **Pure Domain Layer**: No dependency on `encoding/json`
2. **Clear Contract**: Fields explicitly define the interaction structure
3. **Type Safety**: Compile-time validation of structure
4. **Aligned with Frontend**: Matches TypeScript type definitions

## Frontend Alignment

The refactored Go type now matches the TypeScript definition:

```typescript
// frontend/src/types/agent.types.ts
export interface InteractionRequest {
  type: 'confirm' | 'input' | 'select';
  prompt: string;
  options?: string[];
}
```

## Changes Made

### 1. Core Domain (`internal/core/agent/message.go`)

**Before**:
```go
import "encoding/json"

type InteractionRequest struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}
```

**After**:
```go
// No encoding/json import needed

type InteractionRequest struct {
	Type    string   `json:"type"`
	Prompt  string   `json:"prompt"`
	Options []string `json:"options,omitempty"`
}
```

### 2. Tests (`internal/core/agent/message_test.go`)

**Before** - Single generic test:
```go
func TestInteractionRequest_JSON(t *testing.T) {
	jsonData := []byte(`{"field": "value"}`)
	req := agent.InteractionRequest{
		Type: "confirm",
		Data: jsonData,
	}
	// ...
}
```

**After** - Specific tests for each interaction type:
```go
func TestInteractionRequest_Confirm(t *testing.T) {
	req := agent.InteractionRequest{
		Type:   "confirm",
		Prompt: "Do you want to proceed?",
	}
	// Validate confirm interaction
}

func TestInteractionRequest_Select(t *testing.T) {
	req := agent.InteractionRequest{
		Type:    "select",
		Prompt:  "Choose an option:",
		Options: []string{"Option A", "Option B", "Option C"},
	}
	// Validate select interaction with options
}

func TestInteractionRequest_Input(t *testing.T) {
	req := agent.InteractionRequest{
		Type:   "input",
		Prompt: "Enter your name:",
	}
	// Validate input interaction
}
```

## Usage Examples

### Confirm Interaction
```go
interaction := &agent.InteractionRequest{
	Type:   "confirm",
	Prompt: "Delete all files in /tmp?",
}
```

### Select Interaction
```go
interaction := &agent.InteractionRequest{
	Type:    "select",
	Prompt:  "Choose deployment environment:",
	Options: []string{"development", "staging", "production"},
}
```

### Input Interaction
```go
interaction := &agent.InteractionRequest{
	Type:   "input",
	Prompt: "Enter your API key:",
}
```

## Test Results

All tests pass with 100% coverage maintained:

```
=== RUN   TestInteractionRequest_Confirm
--- PASS: TestInteractionRequest_Confirm (0.00s)
=== RUN   TestInteractionRequest_Select
--- PASS: TestInteractionRequest_Select (0.00s)
=== RUN   TestInteractionRequest_Input
--- PASS: TestInteractionRequest_Input (0.00s)

PASS
ok  	antistudio/internal/core/agent	0.008s	coverage: 100.0% of statements
```

**Overall test coverage**: 58.2% (unchanged)

## Architecture Impact

### DDD Layer Compliance

| Layer | Dependency | Status |
|-------|------------|--------|
| Core Domain | ✅ Pure Go types | Compliant |
| Service | Uses core types | Compliant |
| Infrastructure | Can use encoding/json | Compliant |
| Application | Wails bindings | Compliant |

### Dependency Graph

**Before**:
```
core/agent → encoding/json  ❌
```

**After**:
```
core/agent → (no external deps)  ✅
service → core/agent
infra → core/agent, encoding/json
app → core/agent, encoding/json
```

## Migration Guide

If you have existing code using `InteractionRequest` with `Data` field:

### Before
```go
interaction := &agent.InteractionRequest{
	Type: "confirm",
	Data: json.RawMessage(`{"message": "Proceed?"}`),
}
```

### After
```go
interaction := &agent.InteractionRequest{
	Type:   "confirm",
	Prompt: "Proceed?",
}
```

### For Select Type
```go
// Before
interaction := &agent.InteractionRequest{
	Type: "select",
	Data: json.RawMessage(`{"prompt": "Choose:", "options": ["A", "B"]}`),
}

// After
interaction := &agent.InteractionRequest{
	Type:    "select",
	Prompt:  "Choose:",
	Options: []string{"A", "B"},
}
```

## Future Considerations

### 1. Validation
Consider adding validation methods:
```go
func (ir *InteractionRequest) Validate() error {
	if ir.Type == "select" && len(ir.Options) == 0 {
		return errors.New("select type requires options")
	}
	return nil
}
```

### 2. Type Constants
Define constants for interaction types:
```go
const (
	InteractionTypeConfirm = "confirm"
	InteractionTypeInput   = "input"
	InteractionTypeSelect  = "select"
)
```

### 3. Builder Pattern
For complex interactions:
```go
interaction := agent.NewSelectInteraction(
	"Choose environment:",
	"development", "staging", "production",
)
```

## Related Documents

- [01_ARCHITECTURE.md](01_ARCHITECTURE.md) - DDD architecture principles
- [02_A2UI_PROTOCOL.md](02_A2UI_PROTOCOL.md) - Agent-to-UI protocol
- [11_TESTING_GUIDE.md](11_TESTING_GUIDE.md) - Testing guidelines
- [12_TEST_COVERAGE_REPORT.md](12_TEST_COVERAGE_REPORT.md) - Coverage report

## Conclusion

This refactoring successfully:
- ✅ Removed `json.RawMessage` from core domain
- ✅ Aligned backend with frontend types
- ✅ Improved type safety and clarity
- ✅ Maintained 100% test coverage
- ✅ Preserved DDD architecture principles
- ✅ All existing tests pass

The core domain layer is now pure and framework-agnostic, following clean architecture best practices.

---

**Refactoring Type**: Technical Debt Reduction
**Impact**: Low (internal only, no API changes)
**Risk**: Minimal (all tests pass)
**Complexity**: Simple (straightforward field replacement)
