import multer from "multer";
import os from "os";

const storage = multer.diskStorage({
    destination: os.tmpdir()
});

const upload = multer({ storage });

export default upload;