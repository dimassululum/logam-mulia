import ReviewRatingEditScreen from '@/features/admin/ReviewRatingEditScreen'

export default function AdminReviewsRatingEditPage({ params }: { params: { id: string } }) {
  return <ReviewRatingEditScreen productId={params.id} />
}
