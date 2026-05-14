import ArticleFormScreen from '@/features/admin/ArticleFormScreen'

export default function AdminEditArticlePage({ params }: { params: { id: string } }) {
  return <ArticleFormScreen mode="edit" articleId={params.id} />
}
