"use client";

import React from 'react';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Header from "../components/Header";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { FaUserShield } from "react-icons/fa";



export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <FaUserShield className="text-blue-600" /> ChainLegacy
      </h1>

      <ConnectButton />

      {isConnected && (
        <div className="mt-6 text-center">
          <p className="mb-2">Welcome, {address}</p>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700"
            onClick={() => toast.success("Action triggered!")}
          >
            Sample Action
          </button>
        </div>
      )}
    </main>
  );
}