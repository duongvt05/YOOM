import { useEffect, useState } from 'react';
import { getMeetings } from '@/actions/meeting.actions'; // Server Action lấy họp
import { getCurrentUser } from '@/actions/auth.actions'; // Server Action lấy user

export const useGetCalls = () => {
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setIsLoading(true);
        
        // 1. Lấy thông tin User thật đang đăng nhập
        const user = await getCurrentUser();
        
        // Nếu chưa đăng nhập -> Không có dữ liệu
        if (!user) {
            setCalls([]);
            return;
        }

        // 2. Gọi API lấy danh sách cuộc họp CHỈ CỦA USER NÀY
        const meetings = await getMeetings(user._id);
        
        setCalls(meetings);
      } catch (error) {
        console.log("Error fetching meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, []);

  // Logic lọc dữ liệu (Upcoming, Ended...)
  const now = new Date();

  const endedCalls = calls?.filter(({ startsAt }) => new Date(startsAt) < now);
  const upcomingCalls = calls?.filter(({ startsAt }) => new Date(startsAt) > now);
  const callRecordings = calls?.filter((meeting) => meeting.videoUrl); 

  return { 
    endedCalls, 
    upcomingCalls, 
    callRecordings, 
    isLoading 
  };
};