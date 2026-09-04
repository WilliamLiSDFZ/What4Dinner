import { useState } from 'react'

// A recipe's cover photo, or a placeholder standing in for one.
//
// Two ways there can be no picture, and both land on the same placeholder:
// `coverUrl` is null whenever the recipe has no usable photo, and the URLs the
// API hands out are signed for about 15 minutes — a tab left open past that
// would otherwise render a broken-image icon, so a load failure falls back too.
//
// `className` carries the shape, so the same component is the wide cover on a
// dish card and the small square thumb on a favorites row.
export default function DishCover({ url, className }) {
  // Which url failed, not whether one did: a re-fetched list brings a fresh
  // signed url, and storing the url means that one is simply not-failed. A
  // boolean would need an effect to reset it and would stay stuck otherwise.
  const [failedUrl, setFailedUrl] = useState(null)

  if (!url || failedUrl === url) {
    return (
      <div className={`${className} is-empty`}>
        <i className="bi-egg-fried" aria-hidden="true" />
      </div>
    )
  }
  // Decorative: the title beside it already names the dish.
  return <img className={className} src={url} alt="" onError={() => setFailedUrl(url)} />
}
