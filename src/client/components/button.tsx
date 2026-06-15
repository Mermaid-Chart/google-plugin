import { Box, CircularProgress } from '@mui/material';
import { FunctionComponent } from 'react';
import styles from './button.module.css';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'logout';
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
  const getButtonClassName = () => {
    if (variant === 'primary') return styles.buttonPrimary;
    if (variant === 'logout') return styles.buttonLogout;
    return styles.button;
  };

  return (
    <button
      className={`${getButtonClassName()} ${
        loading ? styles.buttonLoading : ''
      } `}
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
