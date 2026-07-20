import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:5000/api/items?page=${page}&limit=12`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load items");
        }

        return res.json();
      })
      .then((data) => {
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((error) => {
        console.error("Error loading items:", error);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
        {loading ? (
          <p className="status-message">Loading fashion items...</p>
        ) : items.length === 0 ? (
          <p className="status-message">No clothing items found.</p>
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
                        alert(`Finding items similar to ${item.productDisplayName}`)
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
      </main>
    </div>
  );
}

export default App;