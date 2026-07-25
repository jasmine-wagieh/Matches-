import { useEffect, useState } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";

function App() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [gender, setGender] = useState("");
  const [colour, setColour] = useState("");
  const [season, setSeason] = useState("");
  const [usage, setUsage] = useState("");

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vivereUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [showAuth, setShowAuth] = useState(false);

  // Similar-items modal
  const [similarItems, setSimilarItems] = useState([]);
  const [similarSource, setSimilarSource] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);

      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          search: activeSearch,
          gender,
          colour,
          season,
          usage,
        });

        const response = await fetch(
          `http://localhost:5000/api/items?${query.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load clothing items.");
        }

        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error loading items:", error);
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [page, activeSearch, gender, colour, season, usage]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    setActiveSearch("");
    setGender("");
    setColour("");
    setSeason("");
    setUsage("");
    setPage(1);
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
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

  const handleLogout = () => {
    localStorage.removeItem("vivereUser");
    setUser(null);
  };

  const handleLike = async (item) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${user.userId}/likes/${item.id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update favourites.");
      }

      const updatedUser = {
        ...user,
        likedItems: data.likedItems || [],
      };

      setUser(updatedUser);
      localStorage.setItem("vivereUser", JSON.stringify(updatedUser));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFindSimilar = async (item) => {
    setSimilarSource(item);
    setSimilarItems([]);
    setSimilarError("");
    setSimilarLoading(true);
    setShowSimilar(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/agent/similar/${item.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to find similar items.");
      }

      setSimilarItems(data.recommendations || []);
    } catch (error) {
      console.error("Similar-item error:", error);
      setSimilarError(error.message);
    } finally {
      setSimilarLoading(false);
    }
  };

  const closeSimilarModal = () => {
    setShowSimilar(false);
    setSimilarItems([]);
    setSimilarSource(null);
    setSimilarError("");
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Vivere</h1>
          <p>Discover fashion selected for your style.</p>
        </div>

        {user ? (
          <div className="user-controls">
            <span>Hello, {user.username}</span>

            <button
              type="button"
              className="profile-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="profile-button"
            onClick={() => setShowAuth(true)}
          >
            Log in
          </button>
        )}
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

          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
          >
            Clear
          </button>
        </form>

        <section className="filter-section">
          <select
            value={gender}
            onChange={(event) =>
              handleFilterChange(setGender, event.target.value)
            }
          >
            <option value="">All genders</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Girls">Girls</option>
            <option value="Boys">Boys</option>
            <option value="Unisex">Unisex</option>
          </select>

          <select
            value={colour}
            onChange={(event) =>
              handleFilterChange(setColour, event.target.value)
            }
          >
            <option value="">All colours</option>
            <option value="Black">Black</option>
            <option value="White">White</option>
            <option value="Blue">Blue</option>
            <option value="Navy Blue">Navy Blue</option>
            <option value="Grey">Grey</option>
            <option value="Red">Red</option>
            <option value="Pink">Pink</option>
            <option value="Green">Green</option>
            <option value="Brown">Brown</option>
            <option value="Beige">Beige</option>
            <option value="Purple">Purple</option>
            <option value="Yellow">Yellow</option>
          </select>

          <select
            value={season}
            onChange={(event) =>
              handleFilterChange(setSeason, event.target.value)
            }
          >
            <option value="">All seasons</option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
            <option value="Fall">Fall</option>
            <option value="Spring">Spring</option>
          </select>

          <select
            value={usage}
            onChange={(event) =>
              handleFilterChange(setUsage, event.target.value)
            }
          >
            <option value="">All uses</option>
            <option value="Casual">Casual</option>
            <option value="Formal">Formal</option>
            <option value="Sports">Sports</option>
            <option value="Travel">Travel</option>
            <option value="Ethnic">Ethnic</option>
          </select>
        </section>

        {(activeSearch || gender || colour || season || usage) && !loading && (
          <p className="search-summary">
            Showing filtered results
            {activeSearch && (
              <>
                {" "}
                for <strong>“{activeSearch}”</strong>
              </>
            )}
          </p>
        )}

        {loading ? (
          <p className="status-message">Loading fashion items...</p>
        ) : items.length === 0 ? (
          <p className="status-message">
            No clothing items matched your filters.
          </p>
        ) : (
          <section className="product-grid">
            {items.map((item) => {
              const isLiked = user?.likedItems?.includes(item.id);

              return (
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
                        type="button"
                        className={
                          isLiked ? "like-button liked" : "like-button"
                        }
                        onClick={() => handleLike(item)}
                      >
                        {isLiked ? "♥ Liked" : "♡ Like"}
                      </button>

                      <button
                        type="button"
                        className="similar-button"
                        onClick={() => handleFindSimilar(item)}
                      >
                        Find similar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && items.length > 0 && (
          <div className="pagination">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={page === 1}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {showAuth && (
        <AuthPage
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            setShowAuth(false);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}

      {showSimilar && (
        <div className="similar-overlay" onClick={closeSimilarModal}>
          <div
            className="similar-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="similar-close"
              onClick={closeSimilarModal}
              aria-label="Close similar-items window"
            >
              ×
            </button>

            <div className="similar-heading">
              <p>Similar to</p>
              <h2>
                {similarSource?.productDisplayName || "Selected product"}
              </h2>
            </div>

            {similarLoading ? (
              <p className="status-message">
                Finding similar fashion items...
              </p>
            ) : similarError ? (
              <p className="status-message">{similarError}</p>
            ) : similarItems.length === 0 ? (
              <p className="status-message">No similar items found.</p>
            ) : (
              <div className="similar-grid">
                {similarItems.map((similarItem) => {
                  const isLiked =
                    user?.likedItems?.includes(similarItem.id);

                  return (
                    <article
                      className="similar-card"
                      key={similarItem.id}
                    >
                      <img
                        src={`/images/${similarItem.id}.jpg`}
                        alt={similarItem.productDisplayName}
                        onError={handleImageError}
                      />

                      <div className="similar-card-content">
                        <p>{similarItem.articleType}</p>
                        <h3>{similarItem.productDisplayName}</h3>

                        <div className="similar-card-tags">
                          <span>{similarItem.baseColour}</span>
                          <span>{similarItem.gender}</span>
                        </div>

                        <button
                          type="button"
                          className={
                            isLiked
                              ? "like-button liked"
                              : "like-button"
                          }
                          onClick={() => handleLike(similarItem)}
                        >
                          {isLiked ? "♥ Liked" : "♡ Like"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;