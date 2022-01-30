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
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from 'lib/firebase'
import useAuth from 'lib/hooks/useAuth'
import useCollectionSnapshot from 'lib/hooks/useCollectionSnapshot'
import useDragAndDrop from 'lib/hooks/useDragAndDrop'
import { cn } from 'lib/utils'
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
  const [uploadProgress, setUploadProgress] = useState([])

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
      const uploadTask = uploadBytesResumable(storageRef, file)
      uploadTask.on(
        'state_changed',
        snapshot => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progressList => {
            const currentProgressIndex = progressList.findIndex(({ id }) => id === addedFileDoc.id)
            // if current progress already in the progress list
            if (currentProgressIndex !== -1) {
              const newProgressList = [...progressList]
              const currentProgress = progressList[currentProgressIndex]
              newProgressList.splice(currentProgressIndex, 1, { ...currentProgress, progress })
              return newProgressList
            }
            return [...progressList, { id: addedFileDoc.id, progress }]
          })
          // console.log(`progress : ${progress}%`)
        },
        error => {
          // if upload unsuccessful
          console.log(error)
        },
        async () => {
          // if upload success
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          setDoc(doc(db, 'files', addedFileDoc.id), { downloadURL }, { merge: true })
        }
      )
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
              <li
                key={file.id}
                className={cn(
                  'group border-2 border-blue-100 rounded-md overflow-hidden hover:border-blue-400',
                  !file.downloadURL
                    ? 'pointer-events-none opacity-40'
                    : 'pointer-events-auto opacity-100'
                )}
              >
                <a
                  href={file.downloadURL}
                  download
                  target='_blank'
                  className='flex justify-between items-center p-2 '
                >
                  <span>
                    {file.name} ({(file.size / 1024).toFixed(1)} kb)
                  </span>
                  {file.downloadURL ? (
                    <DownloadIcon className='w-4 h-4 ml-4 text-blue-400 group-hover:text-blue-600' />
                  ) : (
                    <span className='text-sm font-bold'>
                      {Math.floor(uploadProgress.find(({ id }) => id === file.id)?.progress)}%
                    </span>
                  )}
                </a>
                {!file.downloadURL && (
                  <div
                    className='h-1 bg-blue-400 rounded-full transition-all'
                    style={{
                      width: `${uploadProgress.find(({ id }) => id === file.id)?.progress}%`,
                    }}
                  ></div>
                )}
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
