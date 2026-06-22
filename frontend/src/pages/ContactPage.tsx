import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { initiateCall, sendMessage, sendNotify, validateContact } from '../api/contact'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { Modal } from '../components/ui/Modal'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import { createIdempotencyKey } from '../services/idempotency'
import { getErrorMessage } from '../utils/errors'

const MAX_MESSAGE_LENGTH = 500

interface MessageForm {
  message: string
}

type ActionState = 'idle' | 'loading' | 'success' | 'error'

export function ContactPage() {
  const { uniqueCode = '' } = useParams()
  const { showToast } = useToast()
  const [messageOpen, setMessageOpen] = useState(false)
  const [callState, setCallState] = useState<ActionState>('idle')
  const [notifyState, setNotifyState] = useState<ActionState>('idle')
  const [callConfirmOpen, setCallConfirmOpen] = useState(false)

  const validationQuery = useQuery({
    queryKey: ['contact', uniqueCode],
    queryFn: () => validateContact(uniqueCode),
    enabled: Boolean(uniqueCode),
    retry: false,
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageForm>({ defaultValues: { message: '' } })

  const messageValue = watch('message') ?? ''
  const remaining = MAX_MESSAGE_LENGTH - messageValue.length

  const callMutation = useMutation({
    mutationFn: () => initiateCall(uniqueCode, createIdempotencyKey('call')),
    onMutate: () => setCallState('loading'),
    onSuccess: (data) => {
      setCallState('success')
      showToast(data.message, 'success')
      setCallConfirmOpen(false)
    },
    onError: (error) => {
      setCallState('error')
      showToast(getErrorMessage(error), 'error')
    },
  })

  const notifyMutation = useMutation({
    mutationFn: () => sendNotify(uniqueCode, createIdempotencyKey('notify')),
    onMutate: () => setNotifyState('loading'),
    onSuccess: (data) => {
      setNotifyState('success')
      showToast(data.message, 'success')
    },
    onError: (error) => {
      setNotifyState('error')
      showToast(getErrorMessage(error), 'error')
    },
  })

  const messageMutation = useMutation({
    mutationFn: (payload: MessageForm) =>
      sendMessage(uniqueCode, payload, createIdempotencyKey('message')),
    onSuccess: (data) => {
      showToast(data.message, 'success')
      reset()
      setMessageOpen(false)
    },
    onError: (error) => showToast(getErrorMessage(error), 'error'),
  })

  const options = useMemo(
    () => validationQuery.data?.options ?? ['call', 'message', 'notify'],
    [validationQuery.data?.options],
  )

  if (!uniqueCode) {
    return <ErrorDisplay error="Missing contact code in URL." title="Invalid link" />
  }

  if (validationQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <DashboardSkeleton />
      </div>
    )
  }

  if (validationQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          title="This QR link is invalid"
          description={getErrorMessage(validationQuery.error, 'QR code not found or inactive.')}
        />
      </div>
    )
  }

  const onSubmitMessage = handleSubmit(async (values) => {
    await messageMutation.mutateAsync(values)
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-brand-600">QR Contact</p>
        <h1 className="mt-2 text-3xl font-bold">How would you like to reach out?</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Choose an option below. The owner&apos;s phone number stays private.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {options.includes('call') ? (
          <Card className="space-y-4 text-center">
            <div className="text-3xl">📞</div>
            <h2 className="font-semibold">Call</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Request a callback through the secure relay.
            </p>
            <Button className="w-full" onClick={() => setCallConfirmOpen(true)}>
              Initiate Call
            </Button>
            {callState === 'success' ? (
              <p className="text-sm text-emerald-600">Call initiated successfully.</p>
            ) : null}
            {callState === 'error' ? (
              <p className="text-sm text-red-600">Call could not be started.</p>
            ) : null}
          </Card>
        ) : null}

        {options.includes('message') ? (
          <Card className="space-y-4 text-center">
            <div className="text-3xl">💬</div>
            <h2 className="font-semibold">Message</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Send a short message to the QR owner.
            </p>
            <Button className="w-full" variant="secondary" onClick={() => setMessageOpen(true)}>
              Send Message
            </Button>
          </Card>
        ) : null}

        {options.includes('notify') ? (
          <Card className="space-y-4 text-center">
            <div className="text-3xl">🔔</div>
            <h2 className="font-semibold">Notify</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Alert the owner that someone wants to connect.
            </p>
            <Button
              className="w-full"
              loading={notifyState === 'loading'}
              onClick={() => notifyMutation.mutate()}
            >
              Notify User
            </Button>
            {notifyState === 'success' ? (
              <p className="text-sm text-emerald-600">Notification sent.</p>
            ) : null}
            {notifyState === 'error' ? (
              <p className="text-sm text-red-600">Notification failed.</p>
            ) : null}
          </Card>
        ) : null}
      </div>

      <Modal open={callConfirmOpen} title="Confirm call" onClose={() => setCallConfirmOpen(false)}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will initiate a secure call request. Continue?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCallConfirmOpen(false)}>
            Cancel
          </Button>
          <Button loading={callMutation.isPending} onClick={() => callMutation.mutate()}>
            Confirm call
          </Button>
        </div>
      </Modal>

      <Modal open={messageOpen} title="Send a message" onClose={() => setMessageOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmitMessage}>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Message</span>
            <textarea
              className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900"
              maxLength={MAX_MESSAGE_LENGTH}
              {...register('message', {
                required: 'Message is required',
                maxLength: {
                  value: MAX_MESSAGE_LENGTH,
                  message: `Maximum ${MAX_MESSAGE_LENGTH} characters`,
                },
              })}
            />
            {errors.message ? (
              <span className="text-xs text-red-600">{errors.message.message}</span>
            ) : null}
            <span className="text-xs text-slate-500">{remaining} characters remaining</span>
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setMessageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || messageMutation.isPending}>
              Send message
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
