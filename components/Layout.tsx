import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  isAdmin?: boolean;
  hideNav?: boolean;
}

export default function Layout({ children, title, isAdmin, hideNav }: LayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8F9FF' }}>
      {/* Navigation - glassmorphism floating bar */}
      {!hideNav && (
        <nav className="sticky top-4 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-2 rounded-2xl bg-white/25 backdrop-blur-xl border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between px-6 py-3">
                <Link href="/">
                  <span className="text-2xl font-bold text-blue-600" style={{ fontFamily: "'Stardom', sans-serif" }}>Taskie</span>
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
                        <span className="hidden md:inline text-sm text-blue-600">
                          {(session.user as any)?.name}
                        </span>
                      </div>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <a
                      href="/api/auth/signin"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
          <h1 className="mb-8 text-3xl font-bold text-blue-700 animate-fadeIn">{title}</h1>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-blue-100/40 py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-blue-400/70 sm:px-6 lg:px-8">
          Taskie Forms — Create and manage forms with ease
        </div>
      </footer>
    </div>
  );
}
