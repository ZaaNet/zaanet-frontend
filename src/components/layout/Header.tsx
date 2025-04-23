
import React from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold font-heading bg-gradient-to-r from-zaanet-purple to-zaanet-purple-dark bg-clip-text text-transparent">
            ZaaNet
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/browse" className="text-gray-600 hover:text-zaanet-purple transition-colors">
            Browse Networks
          </Link>
          <Link href="/host-network" className="text-gray-600 hover:text-zaanet-purple transition-colors">
            Host a Network
          </Link>
          <Link href="/litepaper" className="text-gray-600 hover:text-zaanet-purple transition-colors">
            Litepaper
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="bg-transparent border-zaanet-purple text-zaanet-purple hover:bg-zaanet-purple hover:text-white">
            Connect Wallet
          </Button>
          
          <button className="md:hidden text-gray-700 p-2" title="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
