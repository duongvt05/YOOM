// components/ParticipantsList.tsx
import React from 'react';

const ParticipantsList = ({ participants, onClose }: { participants: any[], onClose: () => void }) => {
  return (
    <div className="flex flex-col h-full p-4 bg-dark-1">
      <h2 className="text-xl font-semibold text-white mb-4">Participants List Placeholder</h2>
      {participants.map((p, index) => (
        <p key={index} className="text-sm text-gray-400">{p.name}</p>
      ))}
    </div>
  );
};

export default ParticipantsList;