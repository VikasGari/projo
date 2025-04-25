import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
}));

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <HeroSection>
      <Container maxWidth="md">
        <StyledPaper elevation={3}>
          <Typography
            component="h1"
            variant="h2"
            color="primary"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Welcome to Projo
          </Typography>
          <Typography variant="h5" color="textSecondary" paragraph>
            Your all-in-one project management and collaboration platform
          </Typography>
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate("/signin")}
                sx={{ 
                  py: 2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1.1rem'
                }}
              >
                Get Started
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate("/signin?type=register")}
                sx={{ 
                  py: 2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1.1rem'
                }}
              >
                Create Account
              </Button>
            </Grid>
          </Grid>
        </StyledPaper>
      </Container>
    </HeroSection>
  );
};

export default HomePage; 