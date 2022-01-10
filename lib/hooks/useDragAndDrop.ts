import { useEffect, useRef } from 'react'

export default function useDragAndDrop(callback?: (fileList: FileList) => void, deps?: any[]) {
  const dragAndDropAreaRef = useRef(null)

  useEffect(() => {
    function handleDragOver(event) {
      event.stopPropagation()
      event.preventDefault()
      // Style the drag-and-drop as a "copy file" operation.
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
    }
    function handleDrop(event) {
      event.stopPropagation()
      event.preventDefault()
      if (!event.dataTransfer) return
      const fileList = event.dataTransfer.files
      if (callback) callback(fileList)
    }

    dragAndDropAreaRef.current?.addEventListener('dragover', handleDragOver)
    dragAndDropAreaRef.current?.addEventListener('drop', handleDrop)

    return function cleanup() {
      dragAndDropAreaRef.current?.removeEventListener('dragover', handleDragOver)
      dragAndDropAreaRef.current?.removeEventListener('drop', handleDrop)
    }
  }, deps)

  return dragAndDropAreaRef
}
