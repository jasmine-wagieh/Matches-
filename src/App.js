import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);

      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          search: activeSearch,
        });

        const response = await fetch(
          `http://localhost:5000/api/items?${query.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to load clothing items.");
        }

        const data = await response.json();

        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error loading items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [page, activeSearch]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  };

  const handlePrevious = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    setPage((currentPage) => Math.min(currentPage + 1, totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "https://placehold.co/400x500?text=Image+Unavailable";
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Vivere</h1>
          <p>Discover fashion selected for your style.</p>
        </div>

        <button className="profile-button">Profile</button>
      </header>

      <main>
        <form className="search-section" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search black tops, dresses, shoes..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <button type="submit" className="search-button">
            Search
          </button>

          {activeSearch && (
            <button
              type="button"
              className="clear-button"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </form>

        {activeSearch && !loading && (
          <p className="search-summary">
            Showing results for <strong>“{activeSearch}”</strong>
          </p>
        )}

        {loading ? (
          <p className="status-message">Loading fashion items...</p>
        ) : items.length === 0 ? (
          <p className="status-message">
            No clothing items matched your search.
          </p>
        ) : (
          <section className="product-grid">
            {items.map((item) => (
              <article className="product-card" key={item.id}>
                <div className="image-placeholder">
                  <img
                    src={`/images/${item.id}.jpg`}
                    alt={item.productDisplayName}
                    onError={handleImageError}
                  />
                </div>

                <div className="product-content">
                  <p className="product-category">{item.subCategory}</p>

                  <h2>{item.productDisplayName}</h2>

                  <div className="product-details">
                    <span>{item.baseColour}</span>
                    <span>{item.articleType}</span>
                    <span>{item.gender}</span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="like-button"
                      onClick={() =>
                        alert(`${item.productDisplayName} added to favourites`)
                      }
                    >
                      ♡ Like
                    </button>

                    <button
                      className="similar-button"
                      onClick={() =>
                        alert(
                          `Finding products similar to ${item.productDisplayName}`
                        )
                      }
                    >
                      Find similar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && items.length > 0 && (
          <div className="pagination">
            <button onClick={handlePrevious} disabled={page === 1}>
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button onClick={handleNext} disabled={page === totalPages}>
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;