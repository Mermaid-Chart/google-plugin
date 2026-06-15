import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

const FolderOpenIcon: React.FC<IconProps> = ({
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
        id="mask0_479_32947"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="18"
        height="18"
      >
        <rect width="18" height="18" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_479_32947)">
        <path
          d="M3 15C2.5875 15 2.23438 14.8531 1.94063 14.5594C1.64688 14.2656 1.5 13.9125 1.5 13.5V4.5C1.5 4.0875 1.64688 3.73438 1.94063 3.44063C2.23438 3.14688 2.5875 3 3 3H7.5L9 4.5H15C15.4125 4.5 15.7656 4.64688 16.0594 4.94063C16.3531 5.23438 16.5 5.5875 16.5 6H8.38125L6.88125 4.5H3V13.5L4.8 7.5H17.625L15.6938 13.9312C15.5938 14.2562 15.4094 14.5156 15.1406 14.7094C14.8719 14.9031 14.575 15 14.25 15H3ZM4.575 13.5H14.25L15.6 9H5.925L4.575 13.5Z"
          fill={color}
        />
      </g>
    </svg>
  );
};

export default FolderOpenIcon;
