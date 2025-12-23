/* eslint-disable camelcase */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';

// Import các Server Action
import { createMeeting } from '@/actions/meeting.actions'; 
import { getCurrentUser } from '@/actions/auth.actions'; 

const initialValues = {
  dateTime: new Date(),
  description: '',
  link: '',
};

// FIX LỖI crypto.randomUUID – CHẠY NGON TRÊN MỌI MÁY
const generateRoomId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  
  const [values, setValues] = useState(initialValues);
  const [generatedMeetingId, setGeneratedMeetingId] = useState<string>(""); 
  const { toast } = useToast();
  
  // State lưu user thật
  const [user, setUser] = useState<any>(null);

  // Lấy user ngay khi trang load
  useEffect(() => {
      const fetchUser = async () => {
          const userData = await getCurrentUser();
          if (userData) setUser(userData);
      }
      fetchUser();
  }, []);

  // HÀM TẠO CUỘC HỌP – ĐÃ FIX LỖI crypto.randomUUID
  // MeetingTypeList.tsx – THAY ĐOẠN createMeetingHandler BẰNG ĐOẠN NÀY

const createMeetingHandler = async () => {
  try {
    if (!user) {
      toast({ title: 'Vui lòng đăng nhập để tạo cuộc họp' });
      router.push('/sign-in');
      return;
    }

    if (!values.dateTime && meetingState === 'isScheduleMeeting') {
      toast({ title: 'Please select a date and time' });
      return;
    }

    // FIX LỖI crypto.randomUUID – CHẠY NGON TRÊN MỌI MÁY
    const roomId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const meetingTime = values.dateTime || new Date();
    const meetingDesc = values.description || (meetingState === 'isInstantMeeting' ? 'Cuộc họp tức thì' : 'Cuộc họp đã lên lịch');

    const newMeeting = await createMeeting({
      hostId: user._id,
      title: meetingDesc,
      startTime: meetingTime,
      meetingId: roomId
    });

    if (!newMeeting) {
      toast({ title: 'Lỗi: Không thể tạo cuộc họp' });
      return;
    }

    if (meetingState === 'isInstantMeeting') {
      router.push(`/meeting/${roomId}`);
    } else if (meetingState === 'isScheduleMeeting') {
      setGeneratedMeetingId(roomId);
      toast({ title: 'Tạo cuộc họp thành công!' });
    }

  } catch (error) {
    console.error(error);
    toast({ title: 'Tạo cuộc họp thất bại!' });
  }
};

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/meeting/${generatedMeetingId}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState('isInstantMeeting')}
        className="bg-orange-1"
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-blue-1"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-purple-1"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-yellow-1"
        handleClick={() => router.push('/recordings')}
      />

      {/* MODAL TẠO HỌP TỨC THÌ */}
      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Bắt đầu cuộc họp ngay"
        className="text-center"
        buttonText="Bắt đầu"
        handleClick={createMeetingHandler}
      />

      {/* MODAL LÊN LỊCH */}
      {!generatedMeetingId ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Lên lịch cuộc họp"
          handleClick={createMeetingHandler}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">Mô tả cuộc họp</label>
            <Textarea 
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0 text-white" 
              onChange={(e) => setValues({ ...values, description: e.target.value })} 
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">Chọn ngày giờ</label>
            <ReactDatePicker 
              selected={values.dateTime} 
              onChange={(date) => setValues({ ...values, dateTime: date! })} 
              showTimeSelect 
              timeFormat="HH:mm" 
              timeIntervals={15} 
              timeCaption="time" 
              dateFormat="dd/MM/yyyy HH:mm"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none text-white" 
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => { setMeetingState(undefined); setGeneratedMeetingId(""); }}
          title="Tạo thành công!"
          handleClick={() => { 
            navigator.clipboard.writeText(meetingLink); 
            toast({ title: 'Đã copy link!' });
          }}
          image={'/icons/checked.svg'}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Link"
        />
      )}

      {/* MODAL JOIN */}
      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Nhập link hoặc ID phòng"
        className="text-center"
        buttonText="Tham gia"
        handleClick={() => {
          const link = values.link.trim();
          if (link) {
            router.push(`/meeting/${link}`);
          }
        }}
      >
        <Input 
          placeholder="Dán link hoặc ID phòng vào đây" 
          onChange={(e) => setValues({ ...values, link: e.target.value })} 
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0 text-white" 
        />
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;