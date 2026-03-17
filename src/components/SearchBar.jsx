export default function SearchBar() {
  return (
    <div className="search-wrapper">
      <i className="bi-search" />
      <input
        className="search-bar"
        type="text"
        placeholder="Search dishes..."
      />
    </div>
  )
}
