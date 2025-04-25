import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MdEditor } from 'md-editor-rt';
import { FaArrowLeft } from 'react-icons/fa';
import 'md-editor-rt/lib/style.css';
import { useNotes } from '../../../context/NotesContext';

const NoteEditor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { notes, loading, error, createNote, updateNote, removeNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Fetch note data if editing an existing note
  useEffect(() => {
    if (noteId) {
      const note = notes.find(n => n._id === noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      }
    }
  }, [noteId, notes]);

  // Auto-save functionality
  useEffect(() => {
    if (title || content) {
      // Clear previous timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(() => {
        const autoSaveData = {
          title: title || 'Untitled Note',
          content: content || '',
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('noteAutoSave', JSON.stringify(autoSaveData));
      }, 1000); // Auto-save after 1 second of inactivity

      setAutoSaveTimeout(timeout);
    }

    // Cleanup function
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [title, content]);

  // Load auto-saved content when component mounts
  useEffect(() => {
    const autoSaveData = localStorage.getItem('noteAutoSave');
    if (autoSaveData) {
      const { title: savedTitle, content: savedContent } = JSON.parse(autoSaveData);
      if (!title && !content) {
        setTitle(savedTitle);
        setContent(savedContent);
      }
    }
  }, []);

  const handleSave = async () => {
    console.log('Save button clicked');
    if (!title.trim() && !content.trim()) {
      console.log('No content to save');
      return;
    }

    setSaving(true);
    setSaveError(null);
    
    try {
      console.log('Attempting to save note:', { title, content });
      if (noteId) {
        console.log('Updating existing note:', noteId);
        await updateNote(noteId, { title, content });
      } else {
        console.log('Creating new note');
        await createNote({ title, content });
      }
      console.log('Note saved successfully');
      // Clear auto-save data after successful save
      localStorage.removeItem('noteAutoSave');
      navigate('/notes');
    } catch (err) {
      console.error('Error saving note:', err);
      setSaveError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value) => {
    setContent(value);
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280' }}>Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          color: '#ef4444',
          backgroundColor: '#fee2e2',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          maxWidth: '500px',
          margin: '2rem auto'
        }}>
          <p style={{ marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => navigate('/notes')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '1rem 0',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link
          to="/notes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          <FaArrowLeft /> Back to Notes
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || (!title.trim() && !content.trim())}
          style={{
            backgroundColor: saving ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: saving || (!title.trim() && !content.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {saveError && (
        <div style={{ 
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          {saveError}
        </div>
      )}

      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem'
      }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            fontSize: '1.25rem',
            fontWeight: '500',
            backgroundColor: 'white'
          }}
        />
        
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <MdEditor
            modelValue={content}
            onChange={handleEditorChange}
            theme="light"
            previewTheme="github"
            language="en-US"
            toolbars={[
              'bold', 'italic', 'strikethrough', 'heading', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList',
              'codeRow', 'code', 'link', 'image', 'table', 'revoke', 'next', 'save', 'preview', 'htmlPreview', 'catalog'
            ]}
            style={{ height: '100%' }}
            // Fix for link popup styling
            linkModalConfig={{
              style: {
                width: '500px',
                height: 'auto',
                maxHeight: '80vh',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor; 