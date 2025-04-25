import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaClock, FaSearch, FaList, FaThLarge } from 'react-icons/fa';
import MarkdownIt from 'markdown-it';
import { useNotes } from '../../context/NotesContext';
// Assuming a Notes.css file will be created or exists for specific styles
import './Notes.css'; 

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

const Notes = () => {
  const { notes, loading, error, fetchNotes } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    const savedView = localStorage.getItem('notesViewMode');
    return savedView || 'grid';
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    localStorage.setItem('notesViewMode', viewMode);
  }, [viewMode]);

  const renderMarkdown = (content) => {
    const html = mdParser.render(content);
    // Add target="_blank" to all external links
    const processedHtml = html.replace(
      /<a href="(https?:\/\/[^"]+)"([^>]*)>/g,
      '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
    );
    return { __html: processedHtml };
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      // Use standard loading state defined in pages.css
      <div className="loading-state">
        {/* Add loading icon/spinner if desired */}
        <p>Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      // Use standard error state defined in pages.css
      <div className="error-state">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchNotes}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    // Use standard page container
    <div className="page-container notes-container">
      {/* Page Actions (Search and New Note) */}
      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="view-toggle">
          <button 
            onClick={() => setViewMode('list')} 
            className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            title="List View"
          >
            <FaList />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grid View"
          >
            <FaThLarge />
          </button>
        </div>

        <Link to="/notes/new" className="action-button primary new-note-btn">
          <FaPlus /> New Note
        </Link>
      </div>

      <div className={`notes-content ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <h3>No notes found</h3>
            <p>{searchTerm ? "Try a different search term." : "Create your first note!"}</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
            {filteredNotes.map(note => (
              <Link to={`/notes/${note._id}`} key={note._id} className={`note-card ${viewMode}`}>
                <div className="note-card-header">
                  <h3 className="note-title">{note.title || 'Untitled Note'}</h3>
                  <span className="note-date">
                    <FaClock /> {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div 
                  className="note-content-snippet"
                  dangerouslySetInnerHTML={renderMarkdown(note.content.substring(0, 150) + (note.content.length > 150 ? '...' : ''))}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;