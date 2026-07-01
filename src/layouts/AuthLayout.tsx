import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient p-4 select-none relative overflow-hidden">
      {/* Decorative background grid and shapes */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sap-accent/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/80 dark:bg-sap-gray-900/80 backdrop-blur-md border border-white/20 dark:border-sap-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 z-10 animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
};
