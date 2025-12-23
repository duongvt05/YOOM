"use server";

import { connectToDatabase } from "@/database/mongoose";
import User from "@/database/models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// 1. ĐĂNG KÝ
export const registerUser = async (formData: any) => {
  try {
    await connectToDatabase();

    const { username, email, password } = formData;

    // Kiểm tra user tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) return { error: "Email đã tồn tại!" };

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      // SỬA DÒNG NÀY: Dùng API DiceBear để tạo avatar hoạt hình dựa trên username
      avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}` 
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: "Lỗi đăng ký!" };
  }
};

// 2. ĐĂNG NHẬP
export const loginUser = async (formData: any) => {
  try {
    await connectToDatabase();
    const { email, password } = formData;

    // Tìm user
    const user = await User.findOne({ email });
    if (!user) return { error: "Email không tồn tại!" };

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { error: "Sai mật khẩu!" };

    // Tạo Token (Thẻ bài)
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Lưu Token vào Cookie (Để trình duyệt nhớ)
    cookies().set("token", token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7 // 7 ngày
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: "Lỗi đăng nhập!" };
  }
};

// 3. LẤY THÔNG TIN USER HIỆN TẠI (Thay thế cho user giả)
export const getCurrentUser = async () => {
    try {
        const token = cookies().get("token")?.value;
        if (!token) return null;

        // Giải mã token lấy ID
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        
        await connectToDatabase();
        const user = await User.findById(decoded.id).select("-password"); // Lấy user trừ pass
        
        if(!user) return null;

        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        return null;
    }
}
// --- HÀM MỚI: CẬP NHẬT THÔNG TIN ---
export const updateUser = async (userId: string, formData: any) => {
  try {
    await connectToDatabase();
    const { username, newPassword } = formData;
    
    const updateData: any = {};
    
    // Chỉ cập nhật nếu có dữ liệu gửi lên
    if (username) updateData.username = username;
    
    // Nếu có mật khẩu mới thì mã hóa rồi mới lưu
    if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
    }

    // Tìm và Update
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) return { error: "Không tìm thấy người dùng!" };

    return { success: true };
  } catch (error) {
    console.log("Update error:", error);
    return { error: "Lỗi khi cập nhật thông tin!" };
  }
};

// 4. ĐĂNG XUẤT
export const logoutUser = async () => {
    cookies().delete("token");
    return { success: true };
}