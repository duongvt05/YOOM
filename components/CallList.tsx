'use client';

import { format } from 'date-fns';
import { Calendar, Clock, Play, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';

interface Call {
  _id?: string;
  id?: string;
  title?: string;
  date?: string;
  createdAt?: string;
  startsAt?: string;
  startTime?: string;
  endsAt?: string;
  participants?: number;
  link?: string;
  url?: string;
  roomId?: string;
}

interface CallListProps {
  type: 'upcoming' | 'previous' | 'recordings';
  calls?: Call[];
  initialData?: Call[];
}

const CallList = ({ type, calls = [], initialData = [] }: CallListProps) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();

  if (isLoading) return <Loader />;

  // Chọn dữ liệu hiển thị
  const dataToDisplay: Call[] =
    type === 'recordings'
      ? initialData.length > 0
        ? initialData
        : callRecordings
      : type === 'upcoming'
      ? calls.length > 0
        ? calls
        : upcomingCalls
      : calls.length > 0
      ? calls
      : endedCalls;

  if (!dataToDisplay || dataToDisplay.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-gray-400">
          {type === 'upcoming' && 'No Upcoming Meetings'}
          {type === 'previous' && 'No Previous Meetings'}
          {type === 'recordings' && 'Chưa có bản ghi nào'}
        </h3>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {dataToDisplay.map((call) => {
        const startDateValue = call.date || call.startsAt || call.createdAt || call.startTime || null;
        const startDateObj = startDateValue ? new Date(startDateValue) : null;
        const endDateObj = call.endsAt ? new Date(call.endsAt) : null;

        return (
          <div
            key={call._id || call.id}
            className="group bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/10"
          >
            {/* RECORDINGS UI */}
            {type === 'recordings' && call.url ? (
              <>
                <div
                  className="aspect-video bg-black rounded-xl overflow-hidden mb-4 relative cursor-pointer"
                  onClick={() => router.push(call.url!)}
                >
                  <video
                    src={call.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted
                  />

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="w-16 h-16 text-white" />
                  </div>

                  <div className="absolute bottom-3 left-3 bg-red-600/90 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold">RECORDED</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-blue-400 mb-3">
                  {call.title || `Cuộc họp ${call.roomId?.slice(0, 8).toUpperCase()}...`}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {startDateObj ? format(startDateObj, 'dd/MM/yyyy') : 'No date'}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {startDateObj ? format(startDateObj, 'HH:mm') : '---'}
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={call.url}
                    target="_blank"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold text-center transition"
                  >
                    Xem lại
                  </a>

                  <a
                    href={call.url}
                    download
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition flex items-center justify-center"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* UPCOMING & PREVIOUS UI */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{call.title}</h3>
                  <div className="text-sm text-gray-400">
                    {startDateObj ? format(startDateObj, 'h:mm a') : '---'}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                  {startDateObj ? format(startDateObj, 'EEEE, MMMM d, yyyy') : 'No date'}
                </p>

                {type === 'upcoming' ? (
                  <button
                    onClick={() => router.push(`/meeting/${call.roomId}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition"
                  >
                    Start
                  </button>
                ) : (
                  <div className="bg-gray-800/80 p-3 rounded-xl text-sm text-gray-300 space-y-1">
                    <p><strong>Phòng:</strong> {call.title || call.roomId}</p>
                    <p>
                      <strong>Bắt đầu:</strong>{' '}
                      {startDateObj ? format(startDateObj, 'EEEE, MMMM d, yyyy HH:mm') : '---'}
                    </p>
                    {endDateObj && (
                      <p>
                        <strong>Kết thúc:</strong>{' '}
                        {format(endDateObj, 'EEEE, MMMM d, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CallList;
