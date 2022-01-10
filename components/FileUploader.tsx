import { DownloadIcon, FolderAddIcon, FolderOpenIcon, XIcon } from '@heroicons/react/outline'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from 'lib/firebase'
import useAuth from 'lib/hooks/useAuth'
import useCollectionSnapshot from 'lib/hooks/useCollectionSnapshot'
import useDragAndDrop from 'lib/hooks/useDragAndDrop'
import { useRef, useState } from 'react'

export default function FileUploader() {
  const { user } = useAuth()
  const [files, isFileAvailable] = useCollectionSnapshot(
    query(collection(db, 'files'), where('uploadedBy', '==', user?.email))
  )
  const [openModal, setOpenModal] = useState(false)
  const [overwrite, setOverwrite] = useState(true)
  const fileDropperRef = useDragAndDrop(fileList => {
    if (overwrite) resetFiles()
    uploadFiles(fileList)
  })

  async function resetFiles() {
    const snapshots = await getDocs(
      query(collection(db, 'files'), where('uploadedBy', '==', user?.email))
    )
    snapshots.forEach(eachDoc => {
      const docData = eachDoc.data()
      deleteDoc(doc(db, 'files', eachDoc.id)) // delete firestore ref
      deleteObject(ref(storage, `${user.email}/${docData.name}`)) // delete storage file
    })
  }

  function uploadFiles(newFiles: FileList) {
    const newFilesArray = Array.from(newFiles)

    // close modal
    setOpenModal(false)
    if (!overwrite) setOverwrite(true) // reset to default value

    // upload to firebase
    newFilesArray.map(async file => {
      const addedFileDoc = await addDoc(collection(db, 'files'), {
        name: file.name,
        size: file.size,
        uploadedBy: user.email,
        uploadedAt: serverTimestamp(),
      })

      const storageRef = ref(storage, `${user.email}/${file.name}`)
      const uploadedFile = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(uploadedFile.ref)

      setDoc(doc(db, 'files', addedFileDoc.id), { downloadURL }, { merge: true })
    })
  }

  return (
    <>
      <div className='flex items-center mt-2 text-lg'>
        or
        <button
          onClick={() => setOpenModal(true)}
          className='text-blue-400 hover:text-blue-600 font-medium flex items-center ml-2'
        >
          <FolderOpenIcon className='w-6 h-6 mr-1' /> Select File
        </button>
      </div>

      <SelectFileModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        fileDropperRef={fileDropperRef}
        onFileSelected={e => {
          if (overwrite) resetFiles()
          uploadFiles(e.target.files)
        }}
      />

      {isFileAvailable && (
        <div className='mt-4'>
          <div className='flex items-center space-x-2 mb-3'>
            <h2 className='font-medium'>Selected Files :</h2>
            <button
              onClick={resetFiles}
              className='flex items-center font-medium text-red-400 hover:text-red-600'
            >
              <XIcon className='w-4 h-4 mr-1' /> Clear
            </button>
            <button
              onClick={() => {
                setOpenModal(true)
                setOverwrite(false)
              }}
              className='flex items-center font-medium text-blue-400 hover:text-blue-600'
            >
              <FolderAddIcon className='w-4 h-4 mr-1' /> Add
            </button>
          </div>
          <ul className='space-y-3'>
            {files.map(file => (
              <li key={file.name}>
                <a
                  href={file.downloadURL}
                  download
                  target='_blank'
                  className='flex justify-between items-center group p-2 border-2 border-blue-100 rounded-md hover:border-blue-400'
                >
                  {file.name} ({(file.size / 1024).toFixed(1)} kb)
                  {/* 
                    TODO:
                    [] show loading indicator when its still uploading, when its done show download icon
                  */}
                  <DownloadIcon className='w-4 h-4 ml-4 text-blue-400 group-hover:text-blue-600' />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function SelectFileModal({ open, onClose, fileDropperRef, onFileSelected }) {
  const fileUploaderRef = useRef<HTMLInputElement>(null)

  return (
    <div className={`fixed inset-0 ${open ? 'z-0 opacity-100' : '-z-10 opacity-0'}`}>
      <div onClick={onClose} className='fixed inset-0 bg-black/50'></div>
      <div
        className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md w-[900px] h-[700px] max-w-[90%] max-h-[90vh] flex justify-center items-center flex-col'
        ref={fileDropperRef}
      >
        <button
          onClick={onClose}
          className='absolute right-10 top-10 text-gray-400 hover:text-gray-800'
        >
          <XIcon className='w-10 h-10' />
        </button>
        <button
          className='flex whitespace-nowrap font-medium text-blue-400 hover:text-blue-600'
          onClick={() => fileUploaderRef.current?.click()}
        >
          <FolderOpenIcon className='w-6 h-6 mr-2' /> Select File
        </button>
        <input
          type='file'
          hidden
          aria-hidden='true'
          ref={fileUploaderRef}
          multiple
          onChange={onFileSelected}
        />
        <p className='mt-2'>🖐 or Drag & Drop Files here</p>
      </div>
    </div>
  )
}
