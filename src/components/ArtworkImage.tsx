import { useState } from 'react'
import type { Artwork } from '../artworks'

export default function ArtworkImage({ artwork, imageBase, large = false }: {
  artwork: Artwork
  imageBase: string
  large?: boolean
}) {
  const [failed, setFailed] = useState(false)

  if (!artwork.image_id || failed) {
    return <div className={`image-placeholder${large ? ' detail-image' : ''}`}>No image available</div>
  }

  return (
    <img
      className={`artwork-image${large ? ' detail-image' : ''}`}
      loading={large ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      src={`${imageBase}/${artwork.image_id}/full/843,/0/default.jpg`}
      alt={artwork.title}
      onError={() => setFailed(true)}
    />
  )
}
