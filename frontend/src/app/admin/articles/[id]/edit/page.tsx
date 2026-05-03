import { notFound } from 'next/navigation'
import ArticleFormScreen from '@/features/admin/ArticleFormScreen'
import { adminArticleRecords } from '@/features/admin/admin-management-data'

export default function AdminEditArticlePage({ params }: { params: { id: string } }) {
  const article = adminArticleRecords.find((item) => item.id === params.id)

  if (!article) {
    notFound()
  }

  return <ArticleFormScreen mode="edit" articleId={params.id} />
}
