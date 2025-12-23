// app/(root)/meeting/layout.tsx
import { ReactNode } from 'react';

const MeetingLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="w-full h-screen bg-dark-2 relative z-50">
      {/* Layout này KHÔNG import Navbar hay Sidebar, nên nó sẽ full màn hình */}
      {children}
    </main>
  );
};

export default MeetingLayout;