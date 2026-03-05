import { Box, CircularProgress } from '@mui/material';
import { FunctionComponent } from 'react';
import styles from './button.module.css';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

const Button: FunctionComponent<ButtonProps> = ({
  onClick,
  children,
  disabled,
  style,
  loading = false,
  variant = 'secondary',
  icon,
  ...rest
}) => {
  return (
    <button
      className={`${variant === 'primary' ? styles.buttonPrimary : styles.button} ${loading ? styles.buttonLoading : ''} `}
      style={style}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <Box display="flex" alignItems="center" gap="10px">
        {loading ? <CircularProgress size={14} color="inherit" /> : icon}
        {children}
      </Box>
    </button>
  );
};

export default Button;
