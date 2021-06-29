import { Request } from "express";
import multer from "multer";

const PROFILE_PATH = "public/img/profile/";
const BOARD_PATH = "public/img/board/";

interface MulterRequest extends Request {
    file: any;
    files: any;
}

var prof_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PROFILE_PATH);
    },
    filename: function (req, file, cb) {
        var filename = file.fieldname + "" + Date.now() + ".jpg";
        cb(null, filename);
    },
});

var board_storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, BOARD_PATH);
    },
    filename: function (req, file, cb) {
        var filename = "board" + Date.now() + ".jpg";
        cb(null, filename);
    },
});

var profile_img = multer({ storage: prof_storage }).single("profile");
var board_img = multer({ storage: board_storage }).array("images");

export { profile_img };
export { board_img };
export { PROFILE_PATH };
export { BOARD_PATH };
export { MulterRequest };
