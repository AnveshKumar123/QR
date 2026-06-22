import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { createQRCode, deleteQRCode, getQRCodeImage, listQRCodes } from '../api/qr'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'

export function DashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const qrQuery = useQuery({
    queryKey: ['qr-codes'],
    queryFn: listQRCodes,
  })

  const qrImageQuery = useQuery({
    queryKey: ['qr-image'],
    queryFn: getQRCodeImage,
    enabled: selectedCode !== null,
  })

  const createMutation = useMutation({
    mutationFn: createQRCode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
      setSelectedCode(data.public_code)
      showToast('QR code ready', 'success')
    },
    onError: (error) => showToast(getErrorMessage(error), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQRCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
      setSelectedCode(null)
      showToast('QR code deactivated', 'success')
    },
    onError: (error) => showToast(getErrorMessage(error), 'error'),
  })

  const downloadQR = () => {
    if (!qrImageQuery.data?.qr_image) return
    
    const link = document.createElement('a')
    link.href = qrImageQuery.data.qr_image
    link.download = `qr-contact-${selectedCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (qrQuery.isLoading) {
    return <DashboardSkeleton />
  }

  if (qrQuery.isError) {
    return <ErrorDisplay error={qrQuery.error} title="Failed to load dashboard" />
  }

  const qrCodes = qrQuery.data ?? []

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Manage QR codes linked to your account.
          </p>
        </div>
        <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
          Create QR
        </Button>
      </section>

      <Card>
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Username</dt>
            <dd className="font-medium">{user?.username}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="font-medium">{user?.phone_number}</dd>
          </div>
        </dl>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your QR codes</h2>

        {qrCodes.length === 0 ? (
          <EmptyState
            title="No QR codes yet"
            description="Create a QR code to let people contact you without exposing your phone number."
            action={
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                Create your first QR
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {qrCodes.map((qr) => (
              <Card key={qr.id} className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Public code</p>
                    <p className="mt-1 break-all font-mono text-sm">{qr.public_code}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      qr.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {qr.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Created</dt>
                    <dd>{qr.created_at ? new Date(qr.created_at).toLocaleString() : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Scans</dt>
                    <dd>{qr.scan_count}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Last scanned</dt>
                    <dd>
                      {qr.last_scanned_at
                        ? new Date(qr.last_scanned_at).toLocaleString()
                        : 'Never'}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => setSelectedCode(qr.public_code)}>
                    View QR
                  </Button>
                  <Button
                    variant="danger"
                    loading={deleteMutation.isPending}
                    disabled={!qr.is_active}
                    onClick={() => deleteMutation.mutate(qr.id)}
                  >
                    Delete QR
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {selectedCode ? (
        <Card>
          <h3 className="text-lg font-semibold">Your QR Code</h3>
          {qrImageQuery.isLoading ? (
            <div className="mt-4 text-center text-sm text-slate-500">Loading QR image...</div>
          ) : qrImageQuery.isError ? (
            <div className="mt-4 text-center text-sm text-red-500">Failed to load QR image</div>
          ) : qrImageQuery.data ? (
            <div className="mt-4 space-y-4">
              <div className="flex justify-center">
                <img 
                  src={qrImageQuery.data.qr_image} 
                  alt="QR Code" 
                  className="h-64 w-64 rounded-lg border"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Contact link:</strong> {qrImageQuery.data.contact_url}
                </p>
                <div className="flex gap-3">
                  <Button onClick={downloadQR}>Download QR</Button>
                  <Button variant="secondary" onClick={() => setSelectedCode(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
