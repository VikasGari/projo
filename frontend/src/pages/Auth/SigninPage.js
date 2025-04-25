import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  Link,
} from "@mui/material";

const SigninPage = () => {
  const navigate = useNavigate();
  const { login, register, user, error: authError } = useAuth();
  const [type, setType] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (type === "login") {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      // Don't navigate here - let the useEffect handle it
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleType = () => {
    setType(type === "login" ? "register" : "login");
    setError("");
    setFormData({ email: "", password: "", name: "" });
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography component="h1" variant="h5">
            {type === "login" ? "Sign In" : "Register"}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            {type === "register" && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                autoFocus={type === "register"}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              autoFocus={type === "login"}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete={type === "login" ? "current-password" : "new-password"}
              value={formData.password}
              onChange={handleChange}
            />
            {(error || authError) && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error || authError}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : type === "login" ? (
                "Sign In"
              ) : (
                "Register"
              )}
            </Button>
            <Link
              component="button"
              variant="body2"
              onClick={toggleType}
              sx={{ textAlign: "center", width: "100%", mt: 1 }}
            >
              {type === "login"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SigninPage; 