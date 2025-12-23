"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Play } from "lucide-react";
import { getCurrentUser } from "@/actions/auth.actions"; // Import hàm lấy user thật
import Loader from "@/components/Loader";

const Table = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col items-start gap-2 xl:flex-row xl:items-center">
    <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">{title}:</h1>
    <h1 className="truncate text-sm font-bold text-white max-sm:max-w-[320px] lg:text-xl">{description}</h1>
  </div>
);

const PersonalRoom = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- LẤY USER THẬT TỪ DB ---
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  if (isLoading) return <Loader />;
  if (!user) return null; // Hoặc redirect về login

  // Dùng ID thật của user làm ID phòng
  const meetingId = user._id; 
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const meetingLink = `${baseUrl}/meeting/${meetingId}?personal=true`;

  const startRoom = () => {
    router.push(`/meeting/${meetingId}?personal=true`);
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Personal Meeting Room</h1>
      
      <div className="flex w-full flex-col gap-8 rounded-[20px] bg-dark-2 p-8 xl:max-w-[900px] border border-dark-3 shadow-lg">
        <Table 
            title="Topic" 
            description={`${user.username}'s Meeting Room`} // Hiện tên thật
        />
        <Table 
            title="Meeting ID" 
            description={meetingId} 
        />
        <Table 
            title="Invite Link" 
            description={meetingLink} 
        />
      </div>

      <div className="flex gap-5">
        <Button 
            className="bg-blue-1 hover:bg-blue-600 px-8 py-6 rounded-lg font-semibold transition-all" 
            onClick={startRoom}
        >
          <Play size={20} className="mr-2" />
          Start Meeting
        </Button>
        
        <Button
          className="bg-dark-3 hover:bg-dark-4 px-8 py-6 rounded-lg font-semibold transition-all border border-dark-3"
          onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({
              title: "Link Copied",
              description: "Invitation link has been copied to your clipboard",
            });
          }}
        >
          <Copy size={20} className="mr-2" />
          Copy Invitation
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;