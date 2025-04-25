// Initial notes data
export const initialNotes = [
  {
    id: 1,
    title: "Welcome to Notes",
    content: "# Welcome to Notes\n\nThis is your first note. You can create, edit, and delete notes.",
    createdAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    title: "Getting Started",
    content: "## Getting Started\n\n1. Click on 'Add New Note' to create a note\n2. Use markdown to format your text\n3. Click on a note to view it\n4. Edit or delete notes as needed",
    createdAt: "2023-01-02T00:00:00.000Z"
  }
];

// Function to update initial notes (for development/testing)
export const updateInitialNotes = (newNotes) => {
  // This is just a placeholder - in a real app, this would update a database
  console.log('Initial notes updated:', newNotes);
  return newNotes;
}; 