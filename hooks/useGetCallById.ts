import { useEffect, useState } from 'react';
import { getMeetingById } from '@/actions/meeting.actions'; // Hàm gọi API Server Action

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<any>(null); // 'call' bây giờ là Object từ MongoDB
  const [isCallLoading, setIsCallLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadCall = async () => {
      try {
        setIsCallLoading(true);
        
        // Xử lý trường hợp id là mảng (do Next.js dynamic route)
        const meetingId = Array.isArray(id) ? id[0] : id;

        // Gọi Server Action để lấy dữ liệu từ MongoDB
        const meeting = await getMeetingById(meetingId);

        if (meeting) {
            setCall(meeting);
        }
      } catch (error) {
        console.error("Error fetching meeting:", error);
      } finally {
        setIsCallLoading(false);
      }
    };

    loadCall();
  }, [id]);

  return { call, isCallLoading };
};