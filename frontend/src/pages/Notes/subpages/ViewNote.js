import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaClock } from 'react-icons/fa';
import MarkdownIt from 'markdown-it';
import { useNotes } from '../../../context/NotesContext';

// Configure markdown-it with proper link handling
const mdParser = new MarkdownIt({
  breaks: true, // Enable line breaks
  linkify: true, // Convert URLs to links
  html: true // Enable HTML tags
});

// Override the default link renderer to add target="_blank" and rel="noopener noreferrer"
const defaultRender = mdParser.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

mdParser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Get the href attribute
  const hrefIndex = tokens[idx].attrIndex('href');
  if (hrefIndex >= 0) {
    const href = tokens[idx].attrs[hrefIndex][1];
    
    // Check if it's an external link
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      // Add target="_blank" and rel="noopener noreferrer"
      tokens[idx].attrPush(['target', '_blank']);
      tokens[idx].attrPush(['rel', 'noopener noreferrer']);
    }
  }
  
  // Pass token to default renderer
  return defaultRender(tokens, idx, options, env, self);
};

const ViewNote = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { notes, loading, error, removeNote } = useNotes();

  const note = notes.find(n => n._id === noteId);

  const renderMarkdown = (content) => {
    const html = mdParser.render(content);
    // Add target="_blank" to all external links
    const processedHtml = html.replace(
      /<a href="(https?:\/\/[^"]+)"([^>]*)>/g,
      '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
    );
    return { __html: processedHtml };
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await removeNote(noteId);
        navigate('/notes');
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
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
          <p style={{ color: '#6b7280' }}>Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
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
          <p style={{ marginBottom: '1rem' }}>{error || 'Note not found'}</p>
          <Link 
            to="/notes"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              display: 'inline-block',
              fontWeight: '500'
            }}
          >
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to={`/notes/${noteId}/edit`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <FaEdit /> Edit
          </Link>
          <button
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {/* Note Content */}
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        padding: '0 1rem 2rem 1rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#111827'
        }}>{note.title}</h1>
        
        <div style={{ 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <FaClock size={12} />
          {new Date(note.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <div 
          style={{ 
            fontSize: '1.1rem',
            lineHeight: '1.7',
            color: '#374151'
          }}
          dangerouslySetInnerHTML={renderMarkdown(note.content)}
        />
      </div>
    </div>
  );
};

export default ViewNote; 