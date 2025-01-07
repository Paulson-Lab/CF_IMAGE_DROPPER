const dropZone = document.getElementById('dropZone')
const fileInput = document.getElementById('fileInput')
const imageList = document.getElementById('imageGrid')
const emptyState = document.getElementById('emptyState')

// Debugging: Log when the script loads
console.log('Script loaded successfully')

// Close all menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    closeAllMenus()
  }
})

function closeAllMenus() {
  document.querySelectorAll('.menu-content').forEach(menu => {
    menu.classList.remove('active')
  })
}

function toggleMenu(menuId) {
  closeAllMenus()
  const menu = document.getElementById(menuId)
  menu.classList.toggle('active')
}

// Drag and drop event handlers with debugging logs
dropZone.addEventListener('dragover', (e) => {
  console.log('Dragover event fired') // Debugging
  e.preventDefault()
  dropZone.classList.add('dragover')
})

;['dragleave', 'dragend'].forEach(type => {
  dropZone.addEventListener(type, () => {
    console.log(`${type} event fired`) // Debugging
    dropZone.classList.remove('dragover')
  })
})

dropZone.addEventListener('drop', (e) => {
  console.log('Drop event fired') // Debugging
  e.preventDefault()
  dropZone.classList.remove('dragover')
  
  if (e.dataTransfer.files.length) {
    console.log('Files dropped:', e.dataTransfer.files) // Debugging
    handleFiles(e.dataTransfer.files)
  } else {
    console.log('No files dropped') // Debugging
  }
})

// Click-to-upload
dropZone.addEventListener('click', () => {
  console.log('Drop zone clicked') // Debugging
  fileInput.click()
})

fileInput.addEventListener('change', (e) => {
  if (fileInput.files.length) {
    console.log('Files selected:', fileInput.files) // Debugging
    handleFiles(fileInput.files)
  }
})

async function handleFiles(files) {
  console.log('Handling files:', files) // Debugging
  const formData = new FormData()
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      formData.append('images', file)
    }
  })

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Upload failed')
    }
    
    await loadImages()
  } catch (error) {
    console.error('Upload error:', error)
    alert('Upload failed: ' + error.message)
  }
}

async function loadImages() {
  console.log('Loading images') // Debugging
  try {
    const response = await fetch('/images')
    if (!response.ok) {
      throw new Error('Failed to load images')
    }
    
    const images = await response.json()
    console.log('Images loaded:', images) // Debugging
    
    if (images.length > 0) {
      emptyState.style.display = 'none'
      imageList.className = 'image-list'
      imageList.innerHTML = images.map((img, index) => `
        <div class="image-row" data-filename="${img}">
          <img src="/images/${img}" alt="${img}" class="image-preview" title="${img}">
          <div class="image-filename" title="${img}">${img}</div>
          <div class="menu-container">
            <button class="menu-trigger" onclick="toggleMenu('menu-${index}')">⋮</button>
            <div class="menu-content" id="menu-${index}">
              <button class="menu-item" onclick="copyImageUrl('${img}')">COPY URL</button>
              <button class="menu-item" onclick="renameImage('${img}')">RENAME</button>
              <button class="menu-item" onclick="deleteImage('${img}')">DELETE</button>
            </div>
          </div>
        </div>
      `).join('')
    } else {
      emptyState.style.display = 'block'
      imageList.innerHTML = ''
      imageList.appendChild(emptyState)
    }
  } catch (error) {
    console.error('Error loading images:', error)
    alert('Failed to load images: ' + error.message)
  }
}

window.toggleMenu = toggleMenu

window.copyImageUrl = function(filename) {
  closeAllMenus()
  const url = `${window.location.origin}/images/${filename}`
  navigator.clipboard.writeText(url)
    .then(() => {
      console.log('URL copied:', url) // Debugging
      const notification = document.createElement('div')
      notification.textContent = 'URL copied'
      notification.style.position = 'fixed'
      notification.style.bottom = '20px'
      notification.style.left = '50%'
      notification.style.transform = 'translateX(-50%)'
      notification.style.padding = '8px 16px'
      notification.style.background = '#333'
      notification.style.color = '#fff'
      notification.style.borderRadius = '4px'
      notification.style.fontSize = '0.8rem'
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 2000)
    })
    .catch(() => alert('Failed to copy URL'))
}

window.deleteImage = async function(filename) {
  closeAllMenus()
  if (confirm('Are you sure you want to delete this image?')) {
    try {
      const response = await fetch(`/images/${filename}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }
      
      await loadImages()
    } catch (error) {
      console.error('Error:', error)
      alert('Delete failed: ' + error.message)
    }
  }
}

window.renameImage = async function(oldFilename) {
  closeAllMenus()
  const newFilename = prompt('Enter new filename (with extension):', oldFilename)
  
  if (!newFilename) return // User cancelled
  if (newFilename === oldFilename) return // No change
  
  try {
    const response = await fetch(`/images/${oldFilename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newFilename })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Rename failed')
    }
    
    await loadImages()
  } catch (error) {
    console.error('Error:', error)
    alert('Rename failed: ' + error.message)
  }
}

// Initial load
loadImages()
