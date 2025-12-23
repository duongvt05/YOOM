// app/(root)/meeting/[id]/page.tsx
import React from 'react';
import VideoRoom from "@/components/VideoRoom";

export default function MeetingPage({ params }: { params: { id: string } }) {
  return (
    <main className="h-screen w-full bg-dark-1">
      <VideoRoom roomId={params.id} />
    </main>
  );
}