function SearchForm({ distance, onDistanceChange, onSearch }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSearch();
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>走る距離を選択</h2>
        <label htmlFor="distance">距離</label>
        <select
          id="distance"
          value={distance}
          onChange={(event) => onDistanceChange(event.target.value)}
        >
          <option value={"5"}>5km</option>
          <option value={"8"}>8km</option>
          <option value={"10"}>10km</option>
        </select>
        <button type="submit">検索</button>
      </form>
    </>
  );
}

export default SearchForm;