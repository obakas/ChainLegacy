"use client";

import React from 'react';
import { useAccount } from "wagmi";
import { FaUserShield } from "react-icons/fa";
import Dashboard from '@/components/Dashboard';
// console.log("🏠 Home page loaded");


export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      
        {!isConnected && (
          <><h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
          <>
            <FaUserShield className="text-blue-600" /> ChainLegacy
          </>
        </h1><p className="text-lg text-center mb-6">
            Secure your digital legacy with ChainLegacy. Register your inheritance plan and ensure your assets are passed on to your loved ones.
          </p></>
        )}



      {isConnected && (
        <div className="mt-6 text-center">
          <p className="mb-2">Welcome, {address}</p>
          
          <Dashboard />
        </div>
      )}
    </main>
  );
}