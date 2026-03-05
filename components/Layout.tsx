import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Grainient from './Grainient';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  isAdmin?: boolean;
  hideNav?: boolean;
}

export default function Layout({ children, title, isAdmin, hideNav }: LayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen relative text-slate-800">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Grainient
          color1="#87bfff"
          color2="#3f8efc"
          color3="#2667ff"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      {/* Navigation - glassmorphism floating bar */}
      {!hideNav && (
        <nav className="sticky top-4 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-2 rounded-2xl bg-white/25 backdrop-blur-xl border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between px-6 py-3">
                <Link href="/">
                  <span className="text-2xl font-bold text-[#0c3787]" style={{ fontFamily: "'Stardom', sans-serif" }}>Taskie</span>
                </Link>

                <div className="flex items-center space-x-4">
                  {session ? (
                    <>
                      <div className="flex items-center space-x-3">
                        <img
                          src={(session.user as any)?.image || '/default-avatar.png'}
                          alt={(session.user as any)?.name || 'avatar'}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="hidden md:inline text-sm text-black font-medium">
                          {(session.user as any)?.name}
                        </span>
                      </div>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="text-sm font-medium text-white hover:text-gray-800"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-100"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <a
                      href="/api/auth/signin"
                      className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
                    >
                      Login
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {title && (
          <h1 className="mb-8 text-3xl font-bold text-[#023e8a] animate-fadeIn">{title}</h1>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/20 py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-white/80 sm:px-6 lg:px-8">
          Taskie Forms — Create and manage forms with ease
        </div>
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-white/60 sm:px-6 lg:px-8">
          Copyright © {new Date().getFullYear()} Taskie. All rights reserved.
        </div>
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-white/60 sm:px-6 lg:px-8">
          Design & Developed by <Link href="https://pr1nce.tech" className="text-white hover:text-white/80 font-medium cursor-pointer">Prince</Link>
        </div>
      </footer>
    </div>
  );
}
