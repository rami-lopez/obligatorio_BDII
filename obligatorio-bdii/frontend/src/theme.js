import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#042C53' },
    secondary: { main: '#378ADD' },
    error: { main: '#E24B4A' },
    success: { main: '#3B6D11' },
    warning: { main: '#BA7517' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 13,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#378ADD' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#378ADD',
            boxShadow: 'none',
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
  },
});

export default theme;