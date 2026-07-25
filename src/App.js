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

  // Shop or wishlist
  const [currentView, setCurrentView] = useState("shop");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  // Product-details modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Similar-products modal
  const [similarItems, setSimilarItems] = useState([]);
  const [similarSource, setSimilarSource] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");

  useEffect(() => {
    if (currentView !== "shop") {
      return;
    }

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
  }, [
    page,
    activeSearch,
    gender,
    colour,
    season,
    usage,
    currentView,
  ]);

  const loadWishlist = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setWishlistLoading(true);
    setWishlistError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${user.userId}/likes`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load your wishlist.");
      }

      setWishlistItems(data.items || []);
    } catch (error) {
      console.error("Wishlist error:", error);
      setWishlistItems([]);
      setWishlistError(error.message);
    } finally {
      setWishlistLoading(false);
    }
  };

  const openWishlist = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setCurrentView("wishlist");
    await loadWishlist();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnToShop = () => {
    setCurrentView("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    setWishlistItems([]);
    setCurrentView("shop");
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

      if (!data.liked) {
        setWishlistItems((currentItems) =>
          currentItems.filter(
            (wishlistItem) => wishlistItem.id !== item.id
          )
        );
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleOpenDetails = async (item) => {
    setShowDetails(true);
    setSelectedItem(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/items/${item.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load product details."
        );
      }

      setSelectedItem(data.item);
    } catch (error) {
      console.error("Product details error:", error);
      setDetailsError(error.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetails(false);
    setSelectedItem(null);
    setDetailsError("");
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

  const renderProductCard = (item, wishlistCard = false) => {
    const isLiked = user?.likedItems?.includes(item.id);

    return (
      <article className="product-card" key={item.id}>
        <button
          type="button"
          className="product-image-button"
          onClick={() => handleOpenDetails(item)}
          aria-label={`View details for ${item.productDisplayName}`}
        >
          <div className="image-placeholder">
            <img
              src={`/images/${item.id}.jpg`}
              alt={item.productDisplayName}
              onError={handleImageError}
            />
          </div>
        </button>

        <div className="product-content">
          <p className="product-category">{item.subCategory}</p>

          <button
            type="button"
            className="product-title-button"
            onClick={() => handleOpenDetails(item)}
          >
            {item.productDisplayName}
          </button>

          <div className="product-details">
            <span>{item.baseColour}</span>
            <span>{item.articleType}</span>
            <span>{item.gender}</span>
          </div>

          <div className="card-actions">
            <button
              type="button"
              className={isLiked ? "like-button liked" : "like-button"}
              onClick={() => handleLike(item)}
            >
              {wishlistCard
                ? "♥ Remove"
                : isLiked
                ? "♥ Liked"
                : "♡ Like"}
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
              className="wishlist-button"
              onClick={openWishlist}
            >
              ♥ Wishlist ({user.likedItems?.length || 0})
            </button>

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
        {currentView === "shop" ? (
          <>
            <form className="search-section" onSubmit={handleSearch}>
              <input
                type="search"
                placeholder="Search black tops, dresses, shoes..."
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
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

            {(activeSearch ||
              gender ||
              colour ||
              season ||
              usage) &&
              !loading && (
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
              <p className="status-message">
                Loading fashion items...
              </p>
            ) : items.length === 0 ? (
              <p className="status-message">
                No clothing items matched your filters.
              </p>
            ) : (
              <section className="product-grid">
                {items.map((item) => renderProductCard(item))}
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
          </>
        ) : (
          <section className="wishlist-view">
            <div className="wishlist-heading">
              <div>
                <p className="wishlist-eyebrow">
                  Your saved fashion
                </p>

                <h2>My Wishlist</h2>

                <p>
                  {wishlistItems.length}{" "}
                  {wishlistItems.length === 1 ? "item" : "items"} saved
                </p>
              </div>

              <button
                type="button"
                className="back-to-shop-button"
                onClick={returnToShop}
              >
                ← Back to shop
              </button>
            </div>

            {wishlistLoading ? (
              <p className="status-message">
                Loading your wishlist...
              </p>
            ) : wishlistError ? (
              <p className="status-message">{wishlistError}</p>
            ) : wishlistItems.length === 0 ? (
              <div className="empty-wishlist">
                <h3>Your wishlist is empty</h3>

                <p>
                  Like products in the shop and they will appear here.
                </p>

                <button
                  type="button"
                  className="search-button"
                  onClick={returnToShop}
                >
                  Discover fashion
                </button>
              </div>
            ) : (
              <section className="product-grid">
                {wishlistItems.map((item) =>
                  renderProductCard(item, true)
                )}
              </section>
            )}
          </section>
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

      {showDetails && (
        <div className="details-overlay" onClick={closeDetailsModal}>
          <div
            className="details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="details-close"
              onClick={closeDetailsModal}
              aria-label="Close product details"
            >
              ×
            </button>

            {detailsLoading ? (
              <p className="status-message">
                Loading product details...
              </p>
            ) : detailsError ? (
              <p className="status-message">{detailsError}</p>
            ) : selectedItem ? (
              <div className="details-layout">
                <div className="details-image">
                  <img
                    src={`/images/${selectedItem.id}.jpg`}
                    alt={selectedItem.productDisplayName}
                    onError={handleImageError}
                  />
                </div>

                <div className="details-content">
                  <p className="details-category">
                    {selectedItem.masterCategory} /{" "}
                    {selectedItem.subCategory}
                  </p>

                  <h2>{selectedItem.productDisplayName}</h2>

                  <div className="details-information">
                    <div>
                      <span>Article type</span>
                      <strong>{selectedItem.articleType}</strong>
                    </div>

                    <div>
                      <span>Colour</span>
                      <strong>{selectedItem.baseColour}</strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>{selectedItem.gender}</strong>
                    </div>

                    <div>
                      <span>Season</span>
                      <strong>
                        {selectedItem.season || "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Usage</span>
                      <strong>
                        {selectedItem.usage || "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Year</span>
                      <strong>
                        {selectedItem.year || "Not specified"}
                      </strong>
                    </div>
                  </div>

                  <div className="details-actions">
                    <button
                      type="button"
                      className={
                        user?.likedItems?.includes(selectedItem.id)
                          ? "like-button liked"
                          : "like-button"
                      }
                      onClick={() => handleLike(selectedItem)}
                    >
                      {user?.likedItems?.includes(selectedItem.id)
                        ? "♥ Liked"
                        : "♡ Add to wishlist"}
                    </button>

                    <button
                      type="button"
                      className="similar-button"
                      onClick={() => {
                        const itemToCompare = selectedItem;
                        closeDetailsModal();
                        handleFindSimilar(itemToCompare);
                      }}
                    >
                      Find similar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
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
                {similarSource?.productDisplayName ||
                  "Selected product"}
              </h2>
            </div>

            {similarLoading ? (
              <p className="status-message">
                Finding similar fashion items...
              </p>
            ) : similarError ? (
              <p className="status-message">{similarError}</p>
            ) : similarItems.length === 0 ? (
              <p className="status-message">
                No similar items found.
              </p>
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
                      <button
                        type="button"
                        className="similar-image-button"
                        onClick={() => {
                          closeSimilarModal();
                          handleOpenDetails(similarItem);
                        }}
                      >
                        <img
                          src={`/images/${similarItem.id}.jpg`}
                          alt={similarItem.productDisplayName}
                          onError={handleImageError}
                        />
                      </button>

                      <div className="similar-card-content">
                        <p>{similarItem.articleType}</p>

                        <button
                          type="button"
                          className="similar-title-button"
                          onClick={() => {
                            closeSimilarModal();
                            handleOpenDetails(similarItem);
                          }}
                        >
                          {similarItem.productDisplayName}
                        </button>

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