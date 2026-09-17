// Thêm hàm kiểm tra định dạng email chuẩn
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleAuthAction = async () => {
  // 1. Tự động loại bỏ khoảng trắng thừa do bàn phím tự động điền (Autofill)
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 2. Kiểm tra dữ liệu đầu vào
  if (!cleanEmail) {
    alert("Vui lòng nhập Email!");
    return;
  }

  if (!isValidEmail(cleanEmail)) {
    alert("Email không đúng định dạng chuẩn (ví dụ: user@gmail.com)!");
    return;
  }

  if (!cleanPassword) {
    alert("Vui lòng nhập Mật khẩu!");
    return;
  }

  try {
    if (isSignUp) {
      // Gọi hàm đăng ký với email đã làm sạch
      await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      alert("Đăng ký thành công!");
    } else {
      // Gọi hàm đăng nhập với email đã làm sạch
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      alert("Đăng nhập thành công!");
    }
  } catch (error: any) {
    if (error.code === 'auth/invalid-email') {
      alert("Lỗi xác thực: Định dạng Email không hợp lệ trên hệ thống Firebase!");
    } else if (error.code === 'auth/email-already-in-use') {
      alert("Email này đã được sử dụng!");
    } else if (error.code === 'auth/weak-password') {
      alert("Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!");
    } else {
      alert(`Lỗi đăng nhập: ${error.message}`);
    }
  }
};