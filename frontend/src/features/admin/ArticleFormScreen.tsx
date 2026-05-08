'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { ArrowLeft, ImagePlus, Save } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import {
  formatAdminDateShort,
  type AdminArticleRecord,
  type CatalogStatus,
} from '@/features/admin/admin-management-data'
import { contentsApi } from '@/core/lib/api'
import { SelectField } from '@/features/admin/company-profile-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Badge, Button, Card, Input } from '@/shared/ui'

type ArticleScreenMode = 'create' | 'edit'

interface ArticleFormScreenProps {
  mode: ArticleScreenMode
  articleId?: string
}

interface ArticleFormState {
  title: string
  thumbnailUrl: string
  thumbnailName: string
  publishedAt?: string
  contentHtml: string
  status: CatalogStatus
}

function buildInitialState(article?: AdminArticleRecord): ArticleFormState {
  return {
    title: article?.title ?? '',
    thumbnailUrl: article?.thumbnailUrl ?? '',
    thumbnailName: article ? article.thumbnailUrl.split('/').pop() ?? 'thumbnail' : '',
    publishedAt: article?.publishedAt,
    contentHtml: article?.contentHtml ?? '<p>Tulis isi berita di sini...</p>',
    status: article?.status ?? 'inactive',
  }
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
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
    <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white">
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
  const [formState, setFormState] = useState<ArticleFormState>(buildInitialState(undefined))

  useEffect(() => {
    if (!articleId) return
    contentsApi.getById(articleId).then(({ data }) => {
      const c = data.content ?? data
      const mapped: AdminArticleRecord = {
        id:           c.id,
        slug:         c.slug,
        title:        c.title,
        thumbnailUrl: c.imageUrl ?? '',
        contentHtml:  c.content ?? '',
        publishedAt:  c.createdAt,
        status:       c.status === 'published' ? 'active' : 'inactive',
      }
      setFormState(buildInitialState(mapped))
    }).catch(() => {})
  }, [articleId])
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function saveArticle() {
    if (!formState.title.trim()) {
      showToast('Judul wajib diisi.', 'error')
      return
    }
    if (!formState.thumbnailUrl.trim()) {
      showToast('Foto artikel wajib dipilih.', 'error')
      return
    }
    const plainText = formState.contentHtml.replace(/<[^>]+>/g, '').trim()
    if (!plainText) {
      showToast('Isi berita wajib diisi.', 'error')
      return
    }

    showToast(mode === 'create' ? 'Artikel baru berhasil disimpan.' : 'Artikel berhasil diperbarui.', 'success')
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
            <Button onClick={saveArticle}>
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        }
      />

      <InlineToast toast={toast} />

      <Card padding="md" className="border-navy-100 shadow-elevation-low">
        <div className="space-y-4">
          <Input
            id="article-title"
            label="Judul"
            value={formState.title}
            onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
          />

          {mode === 'edit' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Status"
                value={formState.status}
                onChange={(value) => setFormState((current) => ({ ...current, status: value as CatalogStatus }))}
                options={[
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
              />
              <div className="rounded-2xl border border-navy-100 bg-navy-50 px-4 py-3">
                <p className="text-sm text-navy-500">Waktu terbit</p>
                <p className="mt-1 text-sm font-semibold text-navy-900">
                  {articleId ? formatAdminDateShort(formState.publishedAt ?? '') : '-'}
                </p>
              </div>
            </div>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            <span>Foto</span>
            <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy-500 shadow-elevation-low">
                  <ImagePlus className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-navy-900">{formState.thumbnailName || 'Pilih foto artikel'}</p>
                <p className="text-xs text-navy-500">Klik untuk upload atau ganti gambar</p>
              </div>
            </label>
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
              onChange={(value) => setFormState((current) => ({ ...current, contentHtml: value }))}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
