import React from 'react'
import symbolUrl from '@/assets/gold-f6482.png'

export function GRSymbol({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={symbolUrl} alt="Godoy Prime Realty Symbol" className={className} {...props} />
}
