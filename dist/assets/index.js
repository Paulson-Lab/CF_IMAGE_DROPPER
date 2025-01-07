const dropZone = document.getElementById('dropZone')
const fileInput = document.getElementById('fileInput')
const imageGrid = document.getElementById('imageGrid')
const emptyState = document.getElementById('emptyState')

// Handle drag and drop events
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropZone.classList.add('dragover')
})

['dragleave', 'dragend'].forEach(type => {
  dropZone.addEventListener(type, () => {
    dropZone.classList.remove('dragover')
  })
})

dropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropZone.classList.remove('dragover')
  if (e.dataTransfer.files.length) {
    handleFiles(e.dataTransfer.files)
  }
})

dropZone.addEventListener('click', () => fileInput.click())

fileInput.addEventListener('change', (e) => {
  if (fileInput.files.length) {
    handleFiles(fileInput.files)
  }
})

async function handleFiles(files) {
  const formData = new FormData()
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      formData.append('images', file)
    }
  }

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
    
    const result = await response.json()
    alert(result.message)
    loadImages()
  } catch (error) {
    console.error('Upload error:', error)
    alert('Upload failed: ' + error.message)
  }
}

async function loadImages() {
  try {
    const response = await fetch('/images')
    if (!response.ok) {
      throw new Error('Failed to load images')
    }
    
    const images = await response.json()
    
    if (images.length > 0) {
      emptyState.style.display = 'none'
      imageGrid.innerHTML = images.map(img => `
        <div class="image-card" data-filename="${img}">
          <img src="/images/${img}" alt="${img}">
          <div class="image-actions">
            <button class="rename-btn" onclick="renameImage('${img}')">Rename</button>
            <button class="delete-btn" onclick="deleteImage('${img}')">Delete</button>
          </div>
        </div>
      `).join('')
    } else {
      emptyState.style.display = 'block'
      imageGrid.innerHTML = ''
      imageGrid.appendChild(emptyState)
    }
  } catch (error) {
    console.error('Error loading images:', error)
    alert('Failed to load images: ' + error.message)
  }
}

async function deleteImage(filename) {
  if (confirm('Are you sure you want to delete this image?')) {
    try {
      const response = await fetch(`/images/${filename}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
      
      const result = await response.json()
      alert(result.message)
      loadImages()
    } catch (error) {
      console.error('Error:', error)
      alert('Delete failed: ' + error.message)
    }
  }
}

async function renameImage(oldFilename) {
  const newFilename = prompt('Enter new filename (with extension):', oldFilename)
  if (newFilename && newFilename !== oldFilename) {
    try {
      const response = await fetch(`/images/${oldFilename}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newFilename })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Rename failed')
      }
      
      const result = await response.json()
      alert(result.message)
      loadImages()
    } catch (error) {
      console.error('Error:', error)
      alert('Rename failed: ' + error.message)
    }
  }
}

// Initial load
loadImages()
