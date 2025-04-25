import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from "./components/Layout";
import HomePage from "./pages/Auth/HomePage";
import SigninPage from "./pages/Auth/SigninPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import TeamsPage from "./pages/Teams";
import TeamDetail from "./pages/Teams/TeamDetail";
import EventsPage from "./pages/Events";
import Notes from "./pages/Notes";
import ViewNote from "./pages/Notes/subpages/ViewNote";
import NoteEditor from "./pages/Notes/subpages/NoteEditor";
import ContactsPage from "./pages/Contacts";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import { NotesProvider } from "./context/NotesContext";
import { EventsProvider } from "./context/EventsContext";
import { ContactsProvider } from "./context/ContactsContext";
import { TeamsProvider } from './context/TeamsContext';
import { ProjectsProvider } from './context/ProjectsContext';
import ProjectDetail from "./pages/Projects/ProjectDetail";
import { TasksProvider } from './context/TasksContext';
import { FriendsProvider } from './context/FriendsContext';
import { ProjectChatProvider } from './context/ProjectChatContext';
import { DashboardProvider } from './context/DashboardContext';
import { TeamChatProvider } from './context/TeamChatContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <NotificationProvider>
          <ChatProvider>
            <TeamsProvider>
              <ProjectsProvider>
                <TasksProvider>
                  <ProjectChatProvider>
                    <TeamChatProvider>
                      <FriendsProvider>
                        <EventsProvider>
                          <NotesProvider>
                            <ContactsProvider>
                              <Router>
                                <ToastContainer position="top-right" autoClose={3000} />
                                <Routes>
                                  {/* Public routes */}
                                  <Route path="/" element={<HomePage />} />
                                  <Route path="/signin" element={<SigninPage />} />
                                  
                                  {/* Protected routes */}
                                  <Route
                                    element={
                                      <ProtectedRoute>
                                        <Layout />
                                      </ProtectedRoute>
                                    }
                                  >
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/projects" element={<Projects />} />
                                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                                    <Route path="/teams" element={<TeamsPage />} />
                                    <Route path="/teams/:teamId" element={<TeamDetail />} />
                                    <Route path="/events" element={<EventsPage />} />
                                    <Route path="/notes" element={<Notes />} />
                                    <Route path="/notes/new" element={<NoteEditor />} />
                                    <Route path="/notes/:noteId" element={<ViewNote />} />
                                    <Route path="/notes/:noteId/edit" element={<NoteEditor />} />
                                    <Route path="/contacts" element={<ContactsPage />} />
                                  </Route>
                                </Routes>
                              </Router>
                            </ContactsProvider>
                          </NotesProvider>
                        </EventsProvider>
                      </FriendsProvider>
                    </TeamChatProvider>
                  </ProjectChatProvider>
                </TasksProvider>
              </ProjectsProvider>
            </TeamsProvider>
          </ChatProvider>
        </NotificationProvider>
      </DashboardProvider>
    </AuthProvider>
  );
}

export default App;
