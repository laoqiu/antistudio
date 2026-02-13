package app

import (
	"context"

	"antistudio/internal/service"
)

// SkillAPI provides skill management functionality to the frontend
// IMPORTANT: All struct fields must be JSON serializable for Wails binding.
type SkillAPI struct {
	skillManager *service.SkillManager
}

// NewSkillAPI creates a new skill API handler
func NewSkillAPI(sm *service.SkillManager) *SkillAPI {
	return &SkillAPI{
		skillManager: sm,
	}
}

// ListSkillsResponse wraps the skill list response
type ListSkillsResponse struct {
	Skills []service.SkillInfo `json:"skills"`
	Error  string              `json:"error,omitempty"`
}

// ListSkills returns all available skills
// Context is injected by Wails but not used in this method
func (a *SkillAPI) ListSkills(ctx context.Context) ListSkillsResponse {
	skills, err := a.skillManager.ListSkills()
	if err != nil {
		return ListSkillsResponse{
			Error: err.Error(),
		}
	}

	return ListSkillsResponse{
		Skills: skills,
	}
}

// InstallSkillRequest is the request structure for installing a skill
type InstallSkillRequest struct {
	SourcePath string `json:"source_path"`
}

// InstallSkillResponse is the response structure for skill installation
type InstallSkillResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// InstallSkill installs a custom skill from a local directory
func (a *SkillAPI) InstallSkill(ctx context.Context, req InstallSkillRequest) InstallSkillResponse {
	err := a.skillManager.InstallCustomSkill(req.SourcePath)
	if err != nil {
		return InstallSkillResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return InstallSkillResponse{
		Success: true,
	}
}

// RemoveSkillRequest is the request structure for removing a skill
type RemoveSkillRequest struct {
	SkillName string `json:"skill_name"`
}

// RemoveSkillResponse is the response structure for skill removal
type RemoveSkillResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// RemoveSkill removes a custom skill
func (a *SkillAPI) RemoveSkill(ctx context.Context, req RemoveSkillRequest) RemoveSkillResponse {
	err := a.skillManager.RemoveCustomSkill(req.SkillName)
	if err != nil {
		return RemoveSkillResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return RemoveSkillResponse{
		Success: true,
	}
}

// GetSkillsPathResponse is the response structure for getting skills path
type GetSkillsPathResponse struct {
	Path  string `json:"path"`
	Error string `json:"error,omitempty"`
}

// GetSkillsPath returns the user skills directory path
func (a *SkillAPI) GetSkillsPath(ctx context.Context) GetSkillsPathResponse {
	return GetSkillsPathResponse{
		Path: a.skillManager.GetSkillsPath(),
	}
}
