'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { ArrowLeft, ImagePlus, Save } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { apiClient } from '@/core/lib/api-client'
import {
  formatAdminDateShort,
  type AdminArticleRecord,
  type CatalogStatus,
} from '@/features/admin/admin-management-data'
import { SelectField } from '@/features/admin/company-profile-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Badge, Button, Card, Input } from '@/shared/ui'

type ArticleScreenMode = 'create' | 'edit'
type ArticleFormField = 'title' | 'thumbnailUrl' | 'contentHtml' | 'form'
type ArticleFormErrors = Partial<Record<ArticleFormField, string>>

interface ArticleFormScreenProps {
  mode: ArticleScreenMode
  articleId?: string
}

interface ArticleFormState {
  title: string
  thumbnailUrl: string
  thumbnailName: string
  contentHtml: string
  status: CatalogStatus
}

function buildInitialState(article?: AdminArticleRecord): ArticleFormState {
  return {
    title: article?.title ?? '',
    thumbnailUrl: article?.thumbnailUrl ?? '',
    thumbnailName: article ? article.thumbnailUrl.split('/').pop() ?? 'thumbnail' : '',
    contentHtml: article?.contentHtml ?? '<p></p>',
    status: article?.status ?? 'inactive',
  }
}

function generateSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapArticle(article: any): AdminArticleRecord {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    thumbnailUrl: article.coverUrl || '',
    contentHtml: article.content,
    publishedAt: article.publishedAt || article.createdAt,
    status: article.isPublished ? 'active' : 'inactive',
  }
}

function RichTextEditor({
  value,
  onChange,
  hasError,
}: {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[320px] px-4 py-4 text-sm leading-7 text-navy-800 outline-none [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-navy-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&>blockquote]:rounded-r-xl [&>blockquote]:border-l-4 [&>blockquote]:border-gold-400 [&>blockquote]:bg-gold-50 [&>blockquote]:px-4 [&>blockquote]:py-3 [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:text-xl [&>h2]:font-semibold [&>h3]:mb-3 [&>h3]:mt-5 [&>h3]:text-lg [&>h3]:font-semibold [&>ol]:list-decimal [&>ol]:pl-5 [&>ul]:list-disc [&>ul]:pl-5',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border bg-white',
      hasError ? 'border-red-400' : 'border-navy-200',
    )}>
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 bg-navy-50 px-3 py-3">
        {[
          {
            label: 'B',
            active: editor?.isActive('bold'),
            onClick: () => editor?.chain().focus().toggleBold().run(),
          },
          {
            label: 'I',
            active: editor?.isActive('italic'),
            onClick: () => editor?.chain().focus().toggleItalic().run(),
          },
          {
            label: 'S',
            active: editor?.isActive('strike'),
            onClick: () => editor?.chain().focus().toggleStrike().run(),
          },
          {
            label: 'H2',
            active: editor?.isActive('heading', { level: 2 }),
            onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          },
          {
            label: 'H3',
            active: editor?.isActive('heading', { level: 3 }),
            onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
          },
          {
            label: 'Quote',
            active: editor?.isActive('blockquote'),
            onClick: () => editor?.chain().focus().toggleBlockquote().run(),
          },
          {
            label: 'UL',
            active: editor?.isActive('bulletList'),
            onClick: () => editor?.chain().focus().toggleBulletList().run(),
          },
          {
            label: 'OL',
            active: editor?.isActive('orderedList'),
            onClick: () => editor?.chain().focus().toggleOrderedList().run(),
          },
          {
            label: 'Left',
            active: editor?.isActive({ textAlign: 'left' }),
            onClick: () => editor?.chain().focus().setTextAlign('left').run(),
          },
          {
            label: 'Center',
            active: editor?.isActive({ textAlign: 'center' }),
            onClick: () => editor?.chain().focus().setTextAlign('center').run(),
          },
          {
            label: 'Right',
            active: editor?.isActive({ textAlign: 'right' }),
            onClick: () => editor?.chain().focus().setTextAlign('right').run(),
          },
          {
            label: 'Undo',
            active: false,
            onClick: () => editor?.chain().focus().undo().run(),
          },
          {
            label: 'Redo',
            active: false,
            onClick: () => editor?.chain().focus().redo().run(),
          },
        ].map((button) => (
          <button
            key={button.label}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.onClick}
            className={cn(
              'inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              button.active
                ? 'border-gold-300 bg-gold-50 text-gold-700'
                : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-100',
            )}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (!editor) return
            const previousUrl = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('Masukkan URL link', previousUrl ?? '')

            if (url === null) return

            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }

            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          className={cn(
            'inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            editor?.isActive('link')
              ? 'border-gold-300 bg-gold-50 text-gold-700'
              : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-100',
          )}
        >
          Link
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export default function ArticleFormScreen({ mode, articleId }: ArticleFormScreenProps) {
  const router = useRouter()
  const [article, setArticle] = useState<AdminArticleRecord | undefined>()
  const [formState, setFormState] = useState<ArticleFormState>(buildInitialState(article))
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formErrors, setFormErrors] = useState<ArticleFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (mode !== 'edit' || !articleId) return

    let isMounted = true

    async function fetchArticle() {
      try {
        const { data } = await apiClient.get(`/articles/${articleId}`)
        if (!isMounted) return
        setArticle(mapArticle(data.data))
      } catch (error) {
        console.error('Error fetching article', error)
        showToast('Gagal memuat artikel.', 'error')
      }
    }

    fetchArticle()

    return () => {
      isMounted = false
    }
  }, [articleId, mode])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    setFormState(buildInitialState(article))
    setSelectedFile(null)
    setFormErrors({})
  }, [article])

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function updateFormField<Field extends keyof ArticleFormState>(field: Field, value: ArticleFormState[Field]) {
    setFormState((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => {
      if (!current[field as ArticleFormField] && !current.form) return current
      const next = { ...current }
      delete next[field as ArticleFormField]
      delete next.form
      return next
    })
  }

  function validateForm() {
    const nextErrors: ArticleFormErrors = {}
    const plainText = formState.contentHtml.replace(/<[^>]+>/g, '').trim()

    if (formState.title.trim().length < 3) {
      nextErrors.title = 'Judul minimal 3 karakter.'
    }
    if (!formState.thumbnailUrl.trim()) {
      nextErrors.thumbnailUrl = 'Foto artikel wajib dipilih.'
    }
    if (!plainText) {
      nextErrors.contentHtml = 'Isi berita wajib diisi.'
    } else if (plainText.length < 10) {
      nextErrors.contentHtml = 'Isi berita minimal 10 karakter.'
    }
    if (!generateSlug(formState.title)) {
      nextErrors.title = nextErrors.title ?? 'Judul harus membentuk slug yang valid.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function applyApiErrors(error: any) {
    const errors = error?.response?.data?.errors
    const message = error?.response?.data?.message

    if (Array.isArray(errors) && errors.length > 0) {
      const nextErrors: ArticleFormErrors = {}
      errors.forEach((item: { field?: string; message?: string }) => {
        if (item.field === 'title' || item.field === 'slug') {
          nextErrors.title = item.message || 'Judul belum valid.'
        }
        if (item.field === 'coverUrl') {
          nextErrors.thumbnailUrl = item.message || 'Foto artikel belum valid.'
        }
        if (item.field === 'content') {
          nextErrors.contentHtml = item.message || 'Isi berita belum valid.'
        }
      })
      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors)
        return
      }
    }

    if (message?.toLowerCase().includes('slug')) {
      setFormErrors({ title: 'Judul ini sudah dipakai artikel lain. Ubah judul artikel.' })
      return
    }

    setFormErrors({ form: message || 'Gagal menyimpan artikel. Periksa data lalu coba lagi.' })
  }

  async function uploadCover(articleIdToUpload: string) {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('cover', selectedFile)

    await apiClient.post(`/articles/${articleIdToUpload}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async function saveArticle() {
    if (!validateForm()) return

    const plainText = formState.contentHtml.replace(/<[^>]+>/g, '').trim()
    const slug = article?.slug || generateSlug(formState.title)
    if (!slug) {
      setFormErrors({ title: 'Judul harus membentuk slug yang valid.' })
      return
    }

    const payload = {
      title: formState.title.trim(),
      slug,
      excerpt: plainText.slice(0, 180),
      content: formState.contentHtml,
      coverUrl: selectedFile ? undefined : formState.thumbnailUrl,
      isPublished: formState.status === 'active',
    }

    setIsSaving(true)
    try {
      const response =
        mode === 'create'
          ? await apiClient.post('/articles', payload)
          : await apiClient.put(`/articles/${articleId}`, payload)

      await uploadCover(response.data.data.id)
      showToast(mode === 'create' ? 'Artikel baru berhasil disimpan.' : 'Artikel berhasil diperbarui.', 'success')
      window.setTimeout(() => router.push('/admin/articles'), 700)
    } catch (error) {
      console.error('Error saving article', error)
      applyApiErrors(error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (formState.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formState.thumbnailUrl)
    }
    setFormState((current) => ({
      ...current,
      thumbnailName: file.name,
      thumbnailUrl: URL.createObjectURL(file),
    }))
    setSelectedFile(file)
    setFormErrors((current) => {
      if (!current.thumbnailUrl && !current.form) return current
      const next = { ...current }
      delete next.thumbnailUrl
      delete next.form
      return next
    })
  }

  const pageTitle = mode === 'create' ? 'Tambah Artikel' : 'Edit Artikel'

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={pageTitle}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/articles">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <Button onClick={saveArticle} isLoading={isSaving}>
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        }
      />

      <InlineToast toast={toast} />

      <Card padding="md" className="border-navy-100 shadow-elevation-low">
        <div className="space-y-4">
          {formErrors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formErrors.form}
            </div>
          ) : null}

          <Input
            id="article-title"
            label="Judul"
            value={formState.title}
            error={formErrors.title}
            onChange={(event) => updateFormField('title', event.target.value)}
          />

          {mode === 'edit' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Status"
                value={formState.status}
                onChange={(value) => updateFormField('status', value as CatalogStatus)}
                options={[
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
              />
              <div className="rounded-2xl border border-navy-100 bg-navy-50 px-4 py-3">
                <p className="text-sm text-navy-500">Waktu terbit</p>
                <p className="mt-1 text-sm font-semibold text-navy-900">
                  {article ? formatAdminDateShort(article.publishedAt) : '-'}
                </p>
              </div>
            </div>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            <span>Foto</span>
            <label className={cn(
              'flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40',
              formErrors.thumbnailUrl ? 'border-red-400' : 'border-navy-200',
            )}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy-500 shadow-elevation-low">
                  <ImagePlus className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-navy-900">{formState.thumbnailName || 'Pilih foto artikel'}</p>
                <p className="text-xs text-navy-500">Klik untuk upload atau ganti gambar</p>
              </div>
            </label>
            {formErrors.thumbnailUrl ? <p className="text-xs text-red-500">{formErrors.thumbnailUrl}</p> : null}
          </label>

          {formState.thumbnailUrl ? (
            <Card padding="sm" className="border-navy-100">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-navy-900">Preview foto</p>
                <div className="overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
                  <img src={formState.thumbnailUrl} alt={formState.title || 'Preview artikel'} className="aspect-[16/7] w-full object-cover" />
                </div>
              </div>
            </Card>
          ) : null}

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-navy-700">Isi berita</p>
            <RichTextEditor
              value={formState.contentHtml}
              hasError={Boolean(formErrors.contentHtml)}
              onChange={(value) => updateFormField('contentHtml', value)}
            />
            {formErrors.contentHtml ? <p className="text-xs text-red-500">{formErrors.contentHtml}</p> : null}
          </div>
        </div>
      </Card>
    </div>
  )
}
