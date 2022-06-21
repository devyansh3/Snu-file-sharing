const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const { v4: uuidv4 } = require('uuid');

let storage = multer.diskStorage({
  //storing files in uploads folder
    destination: (req, file, cb) => cb(null, 'uploads/') ,
    filename: (req, file, cb) => {
      //getting a unique name for file by math random function
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        //calling the call back function
              cb(null, uniqueName)
    } ,
});

let upload = multer({
  //setting file upload limit (100mb) and single file upload service 
  storage, limits:{ fileSize: 1000000 * 100 }, }).single('myfile'); //100mb

router.post('/', (req, res) => {
  //validate request
    upload(req, res, async (err) => {

      if(!req.file){
        return res.json({error: 'All fields are reqd'})
      }

      if (err) {
        return res.status(500).send({ error: err.message });
      }
      //storing the data by paasing the data in the request body and storing it in the File Schema of db
        const file = new File({
            filename: req.file.filename,
            uuid: uuidv4(), //gives unique file id
            path: req.file.path, //gives file path from multer
            size: req.file.size // gives file size from multer
        });
        const response = await file.save();
        //response from db server , this is the download link url that we will get 
        // eg: http:localhost:3000/files/dckwdwmokmwpw3323kmc(uuid hai yeh)
        res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` }); 
      });
});

router.post('/send', async (req, res) => {
  const { uuid, emailTo, emailFrom, expiresIn } = req.body;
  if(!uuid || !emailTo || !emailFrom) {
      return res.status(422).send({ error: 'All fields are required except expiry.'});
  }
  // Get data from db 
  try {
    //checking if uuid in db is equal to the uuid enter by user in request
    const file = await File.findOne({ uuid: uuid });
    if(file.sender) {
      return res.status(422).send({ error: 'Email already sent once.'});
    }
    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = await file.save();
    // send mail
    const sendMail = require('../services/mailService');
    sendMail({
      from: emailFrom,
      to: emailTo,
      subject: 'Snu file sharing has sent you a file', //sending these as props to sendMail function
      text: `${emailFrom} shared a file with you.`,
      html: require('../services/emailTemplate')({ //we are calling the anonymous function in emailTemplate.js that returns html
                emailFrom, 
                downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email` , //sharing these are props to emailTemplate.js file
                size: parseInt(file.size/1000) + ' KB',
                expires: '24 hours'
            })
    }).then(() => {
      return res.json({success: true});
    }).catch(err => {
      return res.status(500).json({error: 'Error in email sending.'});
    });
} catch(err) {
  return res.status(500).send({ error: 'Something went wrong.'});
}

});

module.exports = router;