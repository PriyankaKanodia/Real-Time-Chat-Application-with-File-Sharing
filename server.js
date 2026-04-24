const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ensure directories exist
['./uploads', './public'].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// API for file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const fileData = {
            sender: req.body.userName,
            name: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            type: req.file.mimetype,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        io.emit('file message', fileData);
        res.status(200).send('File Uploaded');
    }
});

// Socket logic for real-time messaging
io.on('connection', (socket) => {
    console.log('User Connected');
    socket.on('chat message', (data) => {
        data.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        io.emit('chat message', data);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log("=========================================");
    console.log(`PRO-CHAT SERVER LIVE AT: http://localhost:${PORT}`);
    console.log("=========================================");
});