# Testing Guide

Quick reference for running tests in AntiStudio.

## Quick Start

### Run All Tests
```bash
go test ./internal/...
```

### Run Tests with Coverage
```bash
go test ./internal/... -cover
```

### Generate Coverage Report
```bash
go test ./internal/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
open coverage.html  # macOS
# or
xdg-open coverage.html  # Linux
```

## Running Specific Tests

### By Package
```bash
# Core domain
go test ./internal/core/agent -v

# Service layer
go test ./internal/service -v

# Infrastructure layer
go test ./internal/infra/llm -v

# Application layer
go test ./internal/app -v
```

### By Test Name
```bash
# Run specific test
go test ./internal/service -run TestAgentService_Chat

# Run tests matching pattern
go test ./internal/service -run TestSkill
```

### Integration Tests
```bash
# Database integration tests (requires libSQL)
go test -tags=integration ./internal/infra/database/...
```

## Benchmark Tests

### Run All Benchmarks
```bash
go test -bench=. ./internal/...
```

### Run Specific Benchmark
```bash
go test -bench=BenchmarkAgentAPI_Chat ./internal/app
```

### With Memory Stats
```bash
go test -bench=. -benchmem ./internal/...
```

## Test Options

### Verbose Output
```bash
go test -v ./internal/...
```

### Show Test Coverage Per Function
```bash
go tool cover -func=coverage.out
```

### Race Detector
```bash
go test -race ./internal/...
```

### Short Mode (Skip Long Tests)
```bash
go test -short ./internal/...
```

### Parallel Execution
```bash
go test -parallel 4 ./internal/...
```

## Coverage Targets

Current coverage by module:

```
internal/core/agent:    100.0% ✅
internal/service:        73.6% 🟡
internal/infra/llm:      59.5% 🟡
internal/app:            27.8% 🔴
internal/infra/database:  0.0% (integration only)
```

**Overall: 58.2%**

## Test File Organization

```
internal/
├── core/
│   └── agent/
│       ├── entity.go
│       ├── entity_test.go       ✅ 100%
│       ├── message.go
│       └── message_test.go      ✅ 100%
├── service/
│   ├── agent.go
│   ├── agent_test.go            ✅ 73.6%
│   ├── skill_manager.go
│   ├── skill_manager_test.go    ✅
│   └── skill_integration_test.go ✅
├── infra/
│   ├── llm/
│   │   ├── openai.go
│   │   └── openai_test.go       🟡 59.5%
│   └── database/
│       ├── sqlite.go
│       └── sqlite_test.go       🔒 integration
└── app/
    ├── agent_api.go
    ├── agent_api_test.go        🟡 27.8%
    └── skill_api.go
```

## Writing New Tests

### Test Template
```go
func TestMyFunction(t *testing.T) {
    // 1. Setup
    // Create test data and dependencies

    // 2. Execute
    // Call the function under test

    // 3. Verify
    // Assert expected outcomes
    if got != want {
        t.Errorf("Expected %v, got %v", want, got)
    }
}
```

### Table-Driven Test Template
```go
func TestMyFunction(t *testing.T) {
    tests := []struct {
        name    string
        input   int
        want    int
        wantErr bool
    }{
        {"positive", 5, 25, false},
        {"zero", 0, 0, false},
        {"negative", -1, 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := MyFunction(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("Expected error: %v, got: %v", tt.wantErr, err)
            }
            if got != tt.want {
                t.Errorf("Expected %v, got %v", tt.want, got)
            }
        })
    }
}
```

### Benchmark Template
```go
func BenchmarkMyFunction(b *testing.B) {
    // Setup
    input := prepareInput()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        MyFunction(input)
    }
}
```

## Continuous Integration

### Pre-commit Hook
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
echo "Running tests..."
go test ./internal/... || exit 1
echo "All tests passed!"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### CI Pipeline Example
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
          go-version: '1.24'
      - name: Run tests
        run: go test ./internal/... -cover
      - name: Generate coverage
        run: go test ./internal/... -coverprofile=coverage.out
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage.out
```

## Troubleshooting

### Tests Fail with "No Test Files"
```bash
# Make sure you're in the project root
cd /path/to/antistudio
go test ./internal/...
```

### Coverage Report Not Generated
```bash
# Ensure output file is specified
go test ./internal/... -coverprofile=coverage.out
# Then generate HTML
go tool cover -html=coverage.out -o coverage.html
```

### Integration Tests Fail
```bash
# Make sure to use the integration tag
go test -tags=integration ./internal/infra/database/...

# Install required dependencies
go get github.com/tursodatabase/libsql-client-go/libsql
```

### Wails Runtime Errors
Some tests are skipped because they require Wails runtime context:
```
--- SKIP: TestAgentAPI_Chat (0.00s)
    agent_api_test.go:118: Skipping test that requires Wails runtime context
```

This is expected. These tests require running within a Wails application context.

## Best Practices

### ✅ Do
- Write tests for new features
- Test both success and failure cases
- Use table-driven tests for multiple scenarios
- Mock external dependencies
- Keep tests fast and focused
- Use descriptive test names

### ❌ Don't
- Test implementation details
- Create flaky tests (time-dependent, order-dependent)
- Test external libraries
- Skip cleanup (use `t.TempDir()` for temp files)
- Test multiple things in one test

## Resources

- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [Table-Driven Tests](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests)
- [Test Coverage](https://go.dev/blog/cover)
- [Benchmarking](https://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go)

## Next Steps

1. **Improve Coverage** - Target 80% overall coverage
2. **Add Integration Tests** - More end-to-end scenarios
3. **Performance Testing** - Benchmark critical paths
4. **Mutation Testing** - Verify test quality
5. **Fuzz Testing** - Find edge cases automatically

## Getting Help

If tests are failing or you need help writing tests:

1. Check the test output for specific error messages
2. Review existing tests in the same package for examples
3. Consult the [Testing Guide](TESTING_GUIDE.md)
4. Review the [Coverage Report](TEST_COVERAGE_REPORT.md)

---

**Last Updated**: 2026-01-27
**Test Coverage**: 58.2%
**Total Tests**: 50+
