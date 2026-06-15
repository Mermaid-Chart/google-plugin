import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

const AccountTreeIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#2B2542',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_479_32942"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="18"
        height="18"
      >
        <rect width="18" height="18" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_479_32942)">
        <path
          d="M11.25 15.75V13.5H8.25V6H6.75V8.25H1.5V2.25H6.75V4.5H11.25V2.25H16.5V8.25H11.25V6H9.75V12H11.25V9.75H16.5V15.75H11.25ZM12.75 6.75H15V3.75H12.75V6.75ZM12.75 14.25H15V11.25H12.75V14.25ZM3 6.75H5.25V3.75H3V6.75Z"
          fill={color}
        />
      </g>
    </svg>
  );
};

export default AccountTreeIcon;
