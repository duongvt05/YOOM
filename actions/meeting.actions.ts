"use server";

import { connectToDatabase } from "@/database/mongoose";
import Meeting from "@/database/models/meeting.model";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";

export const createMeeting = async (data: {
  hostId: string;
  title: string;
  startTime: Date;
  meetingId: string;
}) => {
  try {
    console.log("--- BẮT ĐẦU TẠO MEETING ---");
    console.log("1. Dữ liệu nhận được:", data);

    console.log("2. Đang kết nối Database...");
    await connectToDatabase();
    console.log("3. Kết nối Database THÀNH CÔNG!");

    console.log("4. Đang lưu vào Collection 'meetings'...");
    const newMeeting = await Meeting.create({
      meetingId: data.meetingId, // Đảm bảo trường này khớp với Schema
      title: data.title,
      createdBy: data.hostId,
      startsAt: data.startTime,
    });

    console.log("5. ĐÃ LƯU THÀNH CÔNG:", newMeeting);
    
    revalidatePath("/");

    return JSON.parse(JSON.stringify(newMeeting));
  } catch (error) {
    console.error("❌ LỖI NGHIÊM TRỌNG KHI TẠO MEETING:", error);
    // Trả về null để Frontend biết là lỗi
    return null; 
  }
};
// --- HÀM LƯU LINK RECORDING ---
export const addMeetingRecording = async (meetingId: string, videoUrl: string) => {
    try {
        await connectToDatabase();
        const updatedMeeting = await Meeting.findOneAndUpdate(
            { meetingId: meetingId },
            { videoUrl: videoUrl }, // Lưu link video
            { new: true }
        );
        return JSON.parse(JSON.stringify(updatedMeeting));
    } catch (error) {
        console.log("Lỗi lưu recording:", error);
    }
}
// ... (Các hàm getMeetings, getMeetingById giữ nguyên) ...
// Giữ nguyên code cũ của các hàm dưới, chỉ cần sửa hàm createMeeting ở trên thôi.
export const getMeetings = async (userId: string) => {
    try {
        await connectToDatabase();
        const meetings = await Meeting.find({ createdBy: userId }).sort({ createdAt: -1 });
        return JSON.parse(JSON.stringify(meetings));
    } catch (error) {
        console.log(error);
        return [];
    }
};

// actions/meeting.actions.ts

export const getMeetingById = async (id: string) => {
  try {
    await connectToDatabase();

    // Logic tìm kiếm: CHẤP NHẬN MỌI USER
    // Chỉ cần tìm thấy meetingId trùng khớp là trả về
    const meeting = await Meeting.findOne({ meetingId: id }); 
    
    // Nếu không tìm thấy bằng meetingId, thử tìm bằng _id (dự phòng)
    if (!meeting && Types.ObjectId.isValid(id)) {
        const meetingById = await Meeting.findById(id);
        return JSON.parse(JSON.stringify(meetingById));
    }

    return JSON.parse(JSON.stringify(meeting));
  } catch (error) {
    console.log("Error fetching meeting by ID:", error);
    return null;
  }
};