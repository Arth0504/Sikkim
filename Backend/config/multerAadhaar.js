import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/aadhaar/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "") + ext);
  },
});

const fileFilter = (req, file, cb) => {
  // ✅ allow extensions
  const allowedExt = /jpg|jpeg|png|pdf/;
  const ext = allowedExt.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mime = allowedExt.test(file.mimetype);

  // ✅ filename must contain aadhaar / aadhar
  const fileName = file.originalname.toLowerCase();
  const isAadhaar =
    fileName.includes("aadhaar") || fileName.includes("aadhar");

  if (ext && mime && isAadhaar) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only Aadhaar card image/PDF is allowed (filename must contain 'aadhaar')"
      )
    );
  }
};

const uploadAadhaar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export default uploadAadhaar;;
