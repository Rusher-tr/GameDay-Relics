import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
        // here file.originalname shows that is saves the user uploaded file in its original name 
        // because we are saving it temp so over ride issue will not be there 
        // to avoid it we can use 
        //const uniqueSuffix = Date.now()+'-'+Math.round(Math.random()*1E9)
        //cb(null,file.filename+'-'+uniqueSuffix)
    }
})

export const upload = multer({
    storage,
})