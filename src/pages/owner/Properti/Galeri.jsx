import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/utils'
import {
  BedDouble, ImageIcon, Plus, Save, Trash2, UploadCloud, X,
} from 'lucide-react'

function RoomSelector({ room, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-3xl border px-4 py-4 text-left transition-colors',
        active
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl',
          active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
        )}>
          <BedDouble className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{room.name}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">
            {room.type} - {room.totalUnits} unit - {room.images?.length || 0} foto
          </p>
        </div>
      </div>
    </button>
  )
}

function ExistingImageCard({ src, index, onRemove }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={src}
          alt={`Foto kamar ${index + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Foto {index + 1}</p>
          <p className="text-xs text-slate-400">{index === 0 ? 'Foto utama kamar' : 'Tersimpan di galeri kamar'}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-2xl bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function PendingImageCard({ previewUrl, name, onRemove }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-dashed border-blue-300 bg-blue-50/50">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={previewUrl} alt={name} className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-blue-600">Siap diupload</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-2xl bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function PropertiGaleri() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()
  const fileInputRef = useRef(null)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled: !!hotel?.id,
  })

  const [activeRoomId, setActiveRoomId] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])

  useEffect(() => {
    if (!rooms?.length) return

    const hasActiveRoom = rooms.some(room => room.id === activeRoomId)
    const nextRoom = hasActiveRoom ? rooms.find(room => room.id === activeRoomId) : rooms[0]

    setActiveRoomId(nextRoom.id)
    setExistingImages(nextRoom.images || [])
    setNewImages(previous => {
      previous.forEach(item => URL.revokeObjectURL(item.previewUrl))
      return []
    })
  }, [rooms, activeRoomId])

  useEffect(() => () => {
    newImages.forEach(item => URL.revokeObjectURL(item.previewUrl))
  }, [newImages])

  const activeRoom = useMemo(
    () => rooms?.find(room => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  )

  const hasChanges = useMemo(() => {
    if (!activeRoom) return false
    return JSON.stringify(existingImages) !== JSON.stringify(activeRoom.images || []) || newImages.length > 0
  }, [activeRoom, existingImages, newImages])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!hotel?.id || !activeRoom) return null

      const formData = new FormData()
      existingImages.forEach(image => formData.append('existing_images[]', image))
      newImages.forEach(item => formData.append('image_files[]', item.file))

      return hotelApi.updateRoom(hotel.id, activeRoom.id, formData)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-rooms', hotel?.id] })
      qc.invalidateQueries({ queryKey: ['owner-my-hotel'] })
      toast({ title: 'Galeri kamar berhasil diperbarui.' })
      setNewImages(previous => {
        previous.forEach(item => URL.revokeObjectURL(item.previewUrl))
        return []
      })
    },
    onError: () => toast({ title: 'Gagal menyimpan galeri.', variant: 'destructive' }),
  })

  const handleRoomChange = (room) => {
    setActiveRoomId(room.id)
    setExistingImages(room.images || [])
    setNewImages(previous => {
      previous.forEach(item => URL.revokeObjectURL(item.previewUrl))
      return []
    })
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setNewImages(previous => [
      ...previous,
      ...files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])

    event.target.value = ''
  }

  const removeExistingImage = (src) => {
    setExistingImages(previous => previous.filter(image => image !== src))
  }

  const removeNewImage = (previewUrl) => {
    setNewImages(previous => {
      const target = previous.find(item => item.previewUrl === previewUrl)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return previous.filter(item => item.previewUrl !== previewUrl)
    })
  }

  const resetChanges = () => {
    if (!activeRoom) return
    setExistingImages(activeRoom.images || [])
    setNewImages(previous => {
      previous.forEach(item => URL.revokeObjectURL(item.previewUrl))
      return []
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Galeri per Kamar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pilih tipe kamar lalu upload foto terbaik agar calon tamu lebih mudah memahami kondisi unit.
            </p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="skeleton h-24 rounded-[24px]" />
              ))
            ) : rooms?.length ? (
              rooms.map(room => (
                <RoomSelector
                  key={room.id}
                  room={room}
                  active={room.id === activeRoomId}
                  onClick={() => handleRoomChange(room)}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                Tambahkan kamar terlebih dahulu sebelum mengelola galeri.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5 md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Kamar aktif</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {activeRoom?.name || 'Pilih kamar'}
                  </h3>
                  {activeRoom && (
                    <p className="mt-2 text-sm capitalize text-slate-500">
                      {activeRoom.type} - {activeRoom.maxGuests} tamu - {activeRoom.totalUnits} unit
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!activeRoom}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!activeRoom || mutation.isPending || !hasChanges}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {mutation.isPending ? 'Menyimpan...' : 'Simpan Galeri'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {!activeRoom ? (
                <div className="py-16 text-center text-slate-400">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-200" />
                  <p className="mt-4 text-sm">Pilih kamar untuk mulai mengelola galeri.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">Foto tersimpan</h4>
                        <p className="mt-1 text-sm text-slate-500">Foto yang saat ini tampil pada detail kamar.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {existingImages.length} foto
                      </span>
                    </div>

                    {existingImages.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {existingImages.map((src, index) => (
                          <ExistingImageCard
                            key={`${src}-${index}`}
                            src={src}
                            index={index}
                            onRemove={() => removeExistingImage(src)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-500">Belum ada foto untuk kamar ini.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">Foto baru</h4>
                        <p className="mt-1 text-sm text-slate-500">Preview file yang akan diupload saat Anda menyimpan.</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {newImages.length} file
                      </span>
                    </div>

                    {newImages.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {newImages.map(item => (
                          <PendingImageCard
                            key={item.previewUrl}
                            previewUrl={item.previewUrl}
                            name={item.file.name}
                            onRemove={() => removeNewImage(item.previewUrl)}
                          />
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-blue-300 bg-blue-50/40 px-6 py-14 text-center transition-colors hover:bg-blue-50"
                      >
                        <UploadCloud className="h-10 w-10 text-blue-500" />
                        <p className="mt-4 text-sm font-semibold text-slate-900">Klik untuk memilih foto kamar</p>
                        <p className="mt-2 text-xs text-slate-500">Mendukung banyak file sekaligus. Maksimal 5 MB per foto.</p>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeRoom && hasChanges && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetChanges}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Batalkan Perubahan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
