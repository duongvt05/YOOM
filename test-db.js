const mongoose = require('mongoose');

// QUAN TRỌNG: Phải dùng số 127.0.0.1 thay vì chữ localhost
const uri = "mongodb://127.0.0.1:27017/meeting";

async function run() {
  console.log("⏳ Đang thử kết nối tới: " + uri);
  
  try {
    // Thêm timeout 5 giây để nếu lỗi thì báo ngay chứ không treo
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ KẾT NỐI THÀNH CÔNG!");
    
    const TestSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    await TestModel.create({ name: "Test IP 127.0.0.1" });
    console.log("✅ Đã lưu dữ liệu mẫu!");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ KẾT NỐI THẤT BẠI:", err.message);
    process.exit(1);
  }
}

run();