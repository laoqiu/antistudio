package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"antistudio/internal/core/agent"
	"antistudio/internal/core/port"

	_ "github.com/tursodatabase/turso-go"
)

// SQLiteRepository implements port.ConversationRepository using native SQLite
type SQLiteRepository struct {
	db *sql.DB
}

// NewSQLiteRepository creates a new SQLite repository with native SQL
func NewSQLiteRepository(dbPath string) (port.ConversationRepository, error) {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	// Open SQLite database
	db, err := sql.Open("turso", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	repo := &SQLiteRepository{db: db}

	// Initialize schema
	if err := repo.initSchema(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return repo, nil
}

// initSchema creates the database tables if they don't exist
func (r *SQLiteRepository) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS conversations (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		model TEXT NOT NULL DEFAULT 'gpt-4o',
		metadata TEXT NOT NULL DEFAULT '{}',
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL,
		deleted_at INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		conversation_id TEXT NOT NULL,
		role TEXT NOT NULL,
		content TEXT NOT NULL,
		thinking TEXT NOT NULL DEFAULT '',
		prompt_tokens INTEGER NOT NULL DEFAULT 0,
		completion_tokens INTEGER NOT NULL DEFAULT 0,
		created_at INTEGER NOT NULL,
		FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at ON conversations(deleted_at);
	CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
	CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
	`

	_, err := r.db.Exec(schema)
	return err
}

// Create creates a new conversation
func (r *SQLiteRepository) Create(conv *agent.Conversation) error {
	query := `
		INSERT INTO conversations (id, title, model, metadata, created_at, updated_at, deleted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query,
		conv.ID,
		conv.Title,
		conv.Model,
		conv.Metadata,
		conv.CreatedAt,
		conv.UpdatedAt,
		conv.DeletedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create conversation: %w", err)
	}

	return nil
}

// Get retrieves a conversation by ID
func (r *SQLiteRepository) Get(id string) (*agent.Conversation, error) {
	query := `
		SELECT id, title, model, metadata, created_at, updated_at, deleted_at
		FROM conversations
		WHERE id = ? AND deleted_at = 0
	`

	conv := &agent.Conversation{}
	err := r.db.QueryRow(query, id).Scan(
		&conv.ID,
		&conv.Title,
		&conv.Model,
		&conv.Metadata,
		&conv.CreatedAt,
		&conv.UpdatedAt,
		&conv.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get conversation: %w", err)
	}

	return conv, nil
}

// List retrieves conversations with pagination
func (r *SQLiteRepository) List(limit, offset int) ([]*agent.Conversation, error) {
	query := `
		SELECT id, title, model, metadata, created_at, updated_at, deleted_at
		FROM conversations
		WHERE deleted_at = 0
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list conversations: %w", err)
	}
	defer rows.Close()

	var conversations []*agent.Conversation
	for rows.Next() {
		conv := &agent.Conversation{}
		err := rows.Scan(
			&conv.ID,
			&conv.Title,
			&conv.Model,
			&conv.Metadata,
			&conv.CreatedAt,
			&conv.UpdatedAt,
			&conv.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan conversation: %w", err)
		}
		conversations = append(conversations, conv)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating conversations: %w", err)
	}

	return conversations, nil
}

// Update updates an existing conversation
func (r *SQLiteRepository) Update(conv *agent.Conversation) error {
	query := `
		UPDATE conversations
		SET title = ?, model = ?, metadata = ?, updated_at = ?
		WHERE id = ? AND deleted_at = 0
	`

	result, err := r.db.Exec(query,
		conv.Title,
		conv.Model,
		conv.Metadata,
		conv.UpdatedAt,
		conv.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update conversation: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("conversation not found or already deleted")
	}

	return nil
}

// Delete soft-deletes a conversation
func (r *SQLiteRepository) Delete(id string) error {
	query := `
		UPDATE conversations
		SET deleted_at = strftime('%s', 'now')
		WHERE id = ? AND deleted_at = 0
	`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete conversation: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("conversation not found or already deleted")
	}

	return nil
}

// SaveMessage saves a message to the database
func (r *SQLiteRepository) SaveMessage(msg *agent.Message) error {
	query := `
		INSERT INTO messages (id, conversation_id, role, content, thinking, prompt_tokens, completion_tokens, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query,
		msg.ID,
		msg.ConversationID,
		msg.Role,
		msg.Content,
		msg.Thinking,
		msg.PromptTokens,
		msg.CompletionTokens,
		msg.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}

	return nil
}

// GetMessages retrieves messages for a conversation, returns in ASC order (oldest first)
func (r *SQLiteRepository) GetMessages(conversationID string, limit int) ([]*agent.Message, error) {
	// Get the last N messages in DESC order, then reverse
	query := `
		SELECT id, conversation_id, role, content, thinking, prompt_tokens, completion_tokens, created_at
		FROM (
			SELECT * FROM messages
			WHERE conversation_id = ?
			ORDER BY created_at DESC
			LIMIT ?
		)
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(query, conversationID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}
	defer rows.Close()

	var messages []*agent.Message
	for rows.Next() {
		msg := &agent.Message{}
		err := rows.Scan(
			&msg.ID,
			&msg.ConversationID,
			&msg.Role,
			&msg.Content,
			&msg.Thinking,
			&msg.PromptTokens,
			&msg.CompletionTokens,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating messages: %w", err)
	}

	return messages, nil
}

// Close closes the database connection
func (r *SQLiteRepository) Close() error {
	return r.db.Close()
}
