import React from 'react'
import logoUrl from '@/assets/logotipo-negativo-01-eb1e3.png'

export function GodoyLogo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={logoUrl} alt="Godoy Prime Realty Logo" className={className} {...props} />
}
