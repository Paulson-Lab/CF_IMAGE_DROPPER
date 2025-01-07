import express from 'express'
import multer from 'multer'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../images')
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'))
    }
    cb(null, true)
  }
}).array('images')

// API Routes
app.post('/api/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    if (!req.files?.length) {
      return res.status(400).json({ error: 'No images uploaded' })
    }
    res.json({ files: req.files.map(f => f.filename) })
  })
})

app.get('/api/images', (req, res) => {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read images' })
    }
    res.json(files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)))
  })
})

app.get('/api/images/:filename', (req, res) => {
  const filePath = path.join(imagesDir, req.params.filename)
  res.sendFile(filePath)
})

app.delete('/api/images/:filename', (req, res) => {
  const filePath = path.join(imagesDir, req.params.filename)
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete image' })
    }
    res.json({ message: 'Image deleted' })
  })
})

app.put('/api/images/:filename', (req, res) => {
  const oldPath = path.join(imagesDir, req.params.filename)
  const newPath = path.join(imagesDir, req.body.newFilename)
  
  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to rename image' })
    }
    res.json({ message: 'Image renamed' })
  })
})

export default app
