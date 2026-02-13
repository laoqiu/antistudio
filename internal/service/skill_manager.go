package service

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// SkillManager handles skills installation and management
type SkillManager struct {
	userSkillsPath string
	builtinSkills  embed.FS
}

// SkillInfo represents metadata about a skill
type SkillInfo struct {
	Name        string
	Path        string
	IsBuiltin   bool
	HasMetadata bool
}

// NewSkillManager creates a new skill manager
func NewSkillManager(userSkillsPath string, builtinSkills embed.FS) *SkillManager {
	return &SkillManager{
		userSkillsPath: userSkillsPath,
		builtinSkills:  builtinSkills,
	}
}

// Initialize sets up the skills directory on first run
func (sm *SkillManager) Initialize() error {
	// Check if skills directory exists
	if _, err := os.Stat(sm.userSkillsPath); os.IsNotExist(err) {
		fmt.Printf("Initializing skills directory: %s\n", sm.userSkillsPath)

		// Create directory structure
		if err := os.MkdirAll(sm.userSkillsPath, 0755); err != nil {
			return fmt.Errorf("failed to create skills directory: %w", err)
		}

		// Create subdirectories
		builtinPath := filepath.Join(sm.userSkillsPath, "builtin")
		customPath := filepath.Join(sm.userSkillsPath, "custom")

		if err := os.MkdirAll(builtinPath, 0755); err != nil {
			return fmt.Errorf("failed to create builtin directory: %w", err)
		}

		if err := os.MkdirAll(customPath, 0755); err != nil {
			return fmt.Errorf("failed to create custom directory: %w", err)
		}

		// Install built-in skills
		return sm.InstallBuiltinSkills()
	}

	// Skills directory exists, check if we need to update
	return sm.CheckForUpdates()
}

// InstallBuiltinSkills copies embedded skills to user directory
func (sm *SkillManager) InstallBuiltinSkills() error {
	fmt.Println("Installing built-in skills...")

	builtinPath := filepath.Join(sm.userSkillsPath, "builtin")
	count := 0

	// Check if skills directory exists in embedded FS
	if _, err := fs.Stat(sm.builtinSkills, "skills"); err != nil {
		if os.IsNotExist(err) {
			fmt.Println("No built-in skills to install")
			// Create initialization marker anyway
			marker := filepath.Join(sm.userSkillsPath, ".initialized")
			return os.WriteFile(marker, []byte(time.Now().Format(time.RFC3339)), 0644)
		}
		return fmt.Errorf("failed to check skills directory: %w", err)
	}

	// Walk through embedded skills
	err := fs.WalkDir(sm.builtinSkills, "skills", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip the root "skills" directory
		if path == "skills" {
			return nil
		}

		// Calculate relative path from "skills/"
		relPath := strings.TrimPrefix(path, "skills/")
		targetPath := filepath.Join(builtinPath, relPath)

		if d.IsDir() {
			// Create directory
			return os.MkdirAll(targetPath, 0755)
		}

		// Copy file
		content, err := sm.builtinSkills.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read embedded file %s: %w", path, err)
		}

		if err := os.WriteFile(targetPath, content, 0644); err != nil {
			return fmt.Errorf("failed to write file %s: %w", targetPath, err)
		}

		if d.Name() == "SKILL.md" {
			count++
			skillName := filepath.Base(filepath.Dir(relPath))
			fmt.Printf("  ✓ Installed: %s\n", skillName)
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to install builtin skills: %w", err)
	}

	fmt.Printf("✓ Installed %d built-in skill(s)\n", count)

	// Create initialization marker
	marker := filepath.Join(sm.userSkillsPath, ".initialized")
	return os.WriteFile(marker, []byte(time.Now().Format(time.RFC3339)), 0644)
}

// CheckForUpdates checks if built-in skills need updating
func (sm *SkillManager) CheckForUpdates() error {
	// TODO: Implement version checking and updates
	// For now, just return nil
	return nil
}

// ListSkills returns all available skills
func (sm *SkillManager) ListSkills() ([]SkillInfo, error) {
	var skills []SkillInfo

	// Scan builtin skills
	builtinPath := filepath.Join(sm.userSkillsPath, "builtin")
	if builtinSkills, err := sm.scanDirectory(builtinPath, true); err == nil {
		skills = append(skills, builtinSkills...)
	}

	// Scan custom skills
	customPath := filepath.Join(sm.userSkillsPath, "custom")
	if customSkills, err := sm.scanDirectory(customPath, false); err == nil {
		skills = append(skills, customSkills...)
	}

	return skills, nil
}

// scanDirectory scans a directory for SKILL.md files
func (sm *SkillManager) scanDirectory(path string, isBuiltin bool) ([]SkillInfo, error) {
	var skills []SkillInfo

	if _, err := os.Stat(path); os.IsNotExist(err) {
		return skills, nil
	}

	err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && info.Name() == "SKILL.md" {
			skillName := filepath.Base(filepath.Dir(filePath))
			skills = append(skills, SkillInfo{
				Name:      skillName,
				Path:      filePath,
				IsBuiltin: isBuiltin,
			})
		}

		return nil
	})

	return skills, err
}

// GetSkillsPath returns the user skills directory path
func (sm *SkillManager) GetSkillsPath() string {
	return sm.userSkillsPath
}

// InstallCustomSkill installs a skill from a local directory
func (sm *SkillManager) InstallCustomSkill(sourcePath string) error {
	// Verify the skill has SKILL.md
	skillMdPath := filepath.Join(sourcePath, "SKILL.md")
	if _, err := os.Stat(skillMdPath); os.IsNotExist(err) {
		return fmt.Errorf("invalid skill: SKILL.md not found")
	}

	// Get skill name from directory
	skillName := filepath.Base(sourcePath)
	targetPath := filepath.Join(sm.userSkillsPath, "custom", skillName)

	// Check if skill already exists
	if _, err := os.Stat(targetPath); err == nil {
		return fmt.Errorf("skill %s already exists", skillName)
	}

	// Copy skill directory
	return sm.copyDirectory(sourcePath, targetPath)
}

// copyDirectory recursively copies a directory
func (sm *SkillManager) copyDirectory(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calculate target path
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(targetPath, 0755)
		}

		// Copy file
		return sm.copyFile(path, targetPath)
	})
}

// copyFile copies a single file
func (sm *SkillManager) copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}

// RemoveCustomSkill removes a custom skill
func (sm *SkillManager) RemoveCustomSkill(skillName string) error {
	skillPath := filepath.Join(sm.userSkillsPath, "custom", skillName)

	if _, err := os.Stat(skillPath); os.IsNotExist(err) {
		return fmt.Errorf("skill %s not found", skillName)
	}

	return os.RemoveAll(skillPath)
}
