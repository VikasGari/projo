const asyncHandler = require('express-async-handler');
const Note = require('../models/Note');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Helper function to check project access
const checkProjectAccess = async (projectId, userId) => {
    if (!projectId) return true; // If no project, allow access
    const project = await Project.findById(projectId);
    if (!project) return false;
    return project.admin.toString() === userId.toString() || 
           project.members.some(member => member.toString() === userId.toString());
};

// @desc Get all notes for a user
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { projectId, taskId, tag } = req.query;

    // Build query
    const query = {
        $or: [
            { user: userId }, // User's own notes
            { isPrivate: false } // Public notes
        ]
    };

    // Add project filter if provided
    if (projectId) {
        query.project = projectId;
    }

    // Add task filter if provided
    if (taskId) {
        query.task = taskId;
    }

    // Add tag filter if provided
    if (tag) {
        query.tags = tag;
    }

    const notes = await Note.find(query)
        .populate('user', 'name email profile_image')
        .populate('project', 'name')
        .populate('task', 'title')
        .sort({ updatedAt: -1 });

    res.json(notes);
});

// @desc Get a single note by ID
// @route GET /notes/:id
// @access Private
const getNoteById = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id)
        .populate('user', 'name email profile_image')
        .populate('project', 'name')
        .populate('task', 'title');

    if (!note) {
        return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user has access to the note
    if (!note.hasAccess(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to access this note' });
    }

    // If note is associated with a project, check project access
    if (note.project) {
        const hasProjectAccess = await checkProjectAccess(note.project._id, req.user._id);
        if (!hasProjectAccess) {
            return res.status(403).json({ message: 'Not authorized to access this note' });
        }
    }

    res.json(note);
});

// @desc Create a new note
// @route POST /notes
// @access Private
const createNote = asyncHandler(async (req, res) => {
    const { title, content, projectId, taskId, isPrivate, tags } = req.body;
    const userId = req.user._id;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    // If project is specified, check access
    if (projectId) {
        const hasProjectAccess = await checkProjectAccess(projectId, userId);
        if (!hasProjectAccess) {
            return res.status(403).json({ message: 'Not authorized to create notes in this project' });
        }
    }

    // If task is specified, check if user has access to the task's project
    if (taskId) {
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const hasProjectAccess = await checkProjectAccess(task.project._id, userId);
        if (!hasProjectAccess) {
            return res.status(403).json({ message: 'Not authorized to create notes for this task' });
        }
    }

    const note = await Note.create({
        title,
        content,
        user: userId,
        project: projectId || null,
        task: taskId || null,
        isPrivate: isPrivate !== undefined ? isPrivate : true,
        tags: tags || []
    });

    const populatedNote = await Note.findById(note._id)
        .populate('user', 'name email profile_image')
        .populate('project', 'name')
        .populate('task', 'title');

    res.status(201).json(populatedNote);
});

// @desc Update a note
// @route PUT /notes/:id
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { title, content, isPrivate, tags } = req.body;
    const userId = req.user._id;

    const note = await Note.findById(req.params.id);
    if (!note) {
        return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user is the note owner
    if (note.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    // Update note fields
    if (title) note.title = title;
    if (content) note.content = content;
    if (isPrivate !== undefined) note.isPrivate = isPrivate;
    if (tags) note.tags = tags;

    await note.save();

    const updatedNote = await Note.findById(note._id)
        .populate('user', 'name email profile_image')
        .populate('project', 'name')
        .populate('task', 'title');

    res.json(updatedNote);
});

// @desc Delete a note
// @route DELETE /notes/:id
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);
    if (!note) {
        return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user is the note owner
    if (note.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
});

// @desc Get notes by tag
// @route GET /notes/tag/:tag
// @access Private
const getNotesByTag = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { tag } = req.params;

    const notes = await Note.find({
        tags: tag,
        $or: [
            { user: userId },
            { isPrivate: false }
        ]
    })
    .populate('user', 'name email profile_image')
    .populate('project', 'name')
    .populate('task', 'title')
    .sort({ updatedAt: -1 });

    res.json(notes);
});

module.exports = {
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    getNotesByTag
}; 