

import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="p-4 md:p-6 bg-base-200 border-b border-base-300 print-hide">
      <h1 className="text-2xl md:text-3xl font-bold text-base-content">{title}</h1>
    </header>
  );
};

export default Header;