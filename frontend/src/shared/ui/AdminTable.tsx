import Link from 'next/link'
import { cn } from '@/core/lib/utils'

export interface AdminTableColumn {
  id: string
  label: React.ReactNode
  className?: string
}

export interface AdminTableRow {
  id: string
  href?: string
  cells: React.ReactNode[]
  mobileTitle: string
  mobileSubtitle?: React.ReactNode
  mobileMeta?: React.ReactNode
  mobileAside?: React.ReactNode
}

interface AdminTableProps {
  columns: AdminTableColumn[]
  rows: AdminTableRow[]
  emptyState?: React.ReactNode
}

export default function AdminTable({ columns, rows, emptyState }: AdminTableProps) {
  if (!rows.length) {
    return <>{emptyState}</>
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const mobileCardClassName = cn(
            'block rounded-2xl border border-navy-100 bg-white p-4 shadow-elevation-low transition-colors',
            row.href && 'hover:border-gold-300 hover:bg-gold-50/40',
          )

          const content = (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">{row.mobileTitle}</p>
                  {row.mobileSubtitle && (
                    <div className="mt-1 text-sm text-navy-500">{row.mobileSubtitle}</div>
                  )}
                </div>
                {row.mobileAside}
              </div>
              {row.mobileMeta && (
                <div className="mt-3 border-t border-navy-100 pt-3 text-sm text-navy-600">
                  {row.mobileMeta}
                </div>
              )}
            </>
          )

          if (row.href) {
            return (
              <Link key={row.id} href={row.href} className={mobileCardClassName}>
                {content}
              </Link>
            )
          }

          return (
            <div key={row.id} className={mobileCardClassName}>
              {content}
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-elevation-low md:block">
        <table className="w-full min-w-[880px] divide-y divide-navy-100">
          <thead className="bg-navy-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn('px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-navy-500', column.className)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-gold-50/40">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${columns[index]?.id ?? index}`} className="px-5 py-4 text-sm text-navy-700">
                    {row.href ? (
                      <Link href={row.href} className="block">
                        {cell}
                      </Link>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
