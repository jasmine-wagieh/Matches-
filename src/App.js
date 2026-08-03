import { useEffect, useState } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";
import UploadPage from "./components/UploadPage";
import ShopOnlineModal from "./components/ShopOnlineModal";
const API_BASE = "http://localhost:5000";

function App() {
  // -------------------- SHOP --------------------

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
  const [shopOnlineItem, setShopOnlineItem] = useState(null);

  // -------------------- USER --------------------

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vivereUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [showAuth, setShowAuth] = useState(false);

  // -------------------- MAIN VIEW --------------------

  const [currentView, setCurrentView] = useState("shop");

  // -------------------- WISHLIST --------------------

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  // -------------------- STYLIST OPTIONS --------------------

  const [stylistOptions, setStylistOptions] = useState({
    genders: [],
    colours: [],
    usages: [],
    seasons: [],
    articleTypes: [],
  });

  const [stylistOptionsLoading, setStylistOptionsLoading] =
    useState(false);

  const [stylistOptionsError, setStylistOptionsError] =
    useState("");

  // -------------------- PERSONAL STYLIST --------------------

  const [stylistGender, setStylistGender] = useState("");
  const [stylistColours, setStylistColours] = useState([]);
  const [stylistUsage, setStylistUsage] = useState("");
  const [stylistSeason, setStylistSeason] = useState("");
  const [stylistArticleTypes, setStylistArticleTypes] = useState([]);

  const [stylistItems, setStylistItems] = useState([]);
  const [stylistLoading, setStylistLoading] = useState(false);
  const [stylistError, setStylistError] = useState("");
  const [stylistHasRun, setStylistHasRun] = useState(false);

  // -------------------- DETAILS MODAL --------------------

  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // -------------------- SIMILAR PRODUCTS --------------------

  const [similarItems, setSimilarItems] = useState([]);
  const [similarSource, setSimilarSource] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");

  // -------------------- LOAD STYLIST OPTIONS --------------------

  useEffect(() => {
    const loadStylistOptions = async () => {
      setStylistOptionsLoading(true);
      setStylistOptionsError("");

      try {
        const response = await fetch(
          `${API_BASE}/api/stylist/options`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load stylist options."
          );
        }

        setStylistOptions({
          genders: data.options?.genders || [],
          colours: data.options?.colours || [],
          usages: data.options?.usages || [],
          seasons: data.options?.seasons || [],
          articleTypes: data.options?.articleTypes || [],
        });
      } catch (error) {
        console.error("Stylist options error:", error);

        setStylistOptions({
          genders: [],
          colours: [],
          usages: [],
          seasons: [],
          articleTypes: [],
        });

        setStylistOptionsError(error.message);
      } finally {
        setStylistOptionsLoading(false);
      }
    };

    loadStylistOptions();
  }, []);

  // -------------------- LOAD SHOP ITEMS --------------------

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
          `${API_BASE}/api/items?${query.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load clothing items."
          );
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

  // -------------------- WISHLIST --------------------

  const loadWishlist = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setWishlistLoading(true);
    setWishlistError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/users/${user.userId}/likes`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load your wishlist."
        );
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
// -------------------- TASTE RECOMMENDATIONS --------------------

const [recommendedItems, setRecommendedItems] = useState([]);
const [recommendationsLoading, setRecommendationsLoading] =
  useState(false);
const [recommendationsError, setRecommendationsError] =
  useState("");
const [tasteProfile, setTasteProfile] = useState(null);
const [recommendationsMessage, setRecommendationsMessage] =
  useState("");
const loadTasteRecommendations = async () => {
  if (!user) {
    setShowAuth(true);
    return;
  }

  setRecommendationsLoading(true);
  setRecommendationsError("");
  setRecommendationsMessage("");

  try {
    const response = await fetch(
      `${API_BASE}/api/users/${user.userId}/recommendations`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to load recommendations."
      );
    }

    setRecommendedItems(data.items || []);
    setTasteProfile(data.tasteProfile || null);
    setRecommendationsMessage(data.message || "");
  } catch (error) {
    console.error("Taste recommendations error:", error);

    setRecommendedItems([]);
    setTasteProfile(null);
    setRecommendationsError(error.message);
  } finally {
    setRecommendationsLoading(false);
  }
};
const openRecommendations = async () => {
  if (!user) {
    setShowAuth(true);
    return;
  }

  setCurrentView("recommendations");
  await loadTasteRecommendations();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
// -------------------- RECOMMENDATIONS VIEW --------------------

const renderRecommendations = () => (
  <section className="wishlist-view">
    <div className="wishlist-heading">
      <div>
        <p className="wishlist-eyebrow">
          Learned from your wishlist
        </p>

        <h2>Recommended for You</h2>

        <p>
          Vivere analyses your liked colours, categories,
          occasions and seasons to discover more products
          that match your taste.
        </p>
      </div>

      <button
        type="button"
        className="back-to-shop-button"
        onClick={openShop}
      >
        ← Back to shop
      </button>
    </div>

    {recommendationsLoading ? (
      <p className="status-message">
        Learning your style and finding recommendations...
      </p>
    ) : recommendationsError ? (
      <p className="status-message">
        {recommendationsError}
      </p>
    ) : recommendationsMessage &&
      recommendedItems.length === 0 ? (
      <div className="empty-wishlist">
        <h3>Vivere needs more information</h3>

        <p>{recommendationsMessage}</p>

        <button
          type="button"
          className="search-button"
          onClick={openShop}
        >
          Discover and like products
        </button>
      </div>
    ) : recommendedItems.length === 0 ? (
      <div className="empty-wishlist">
        <h3>No recommendations yet</h3>

        <p>
          Like a few products so Vivere can learn your
          preferences.
        </p>

        <button
          type="button"
          className="search-button"
          onClick={openShop}
        >
          Browse fashion
        </button>
      </div>
    ) : (
      <>
        {tasteProfile && (
          <section className="stylist-results">
            <div className="stylist-results-heading">
              <p>Your learned taste</p>

              <h3>Vivere Style Profile</h3>

              <span>
                Based on {user?.likedItems?.length || 0} liked{" "}
                {(user?.likedItems?.length || 0) === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            <div className="product-details">
              {tasteProfile.articleTypes?.map((value) => (
                <span key={`type-${value}`}>{value}</span>
              ))}

              {tasteProfile.categories?.map((value) => (
                <span key={`category-${value}`}>{value}</span>
              ))}

              {tasteProfile.colours?.map((value) => (
                <span key={`colour-${value}`}>{value}</span>
              ))}

              {tasteProfile.usages?.map((value) => (
                <span key={`usage-${value}`}>{value}</span>
              ))}

              {tasteProfile.seasons?.map((value) => (
                <span key={`season-${value}`}>{value}</span>
              ))}
            </div>
          </section>
        )}

        <section className="stylist-results">
          <div className="stylist-results-heading">
            <p>Selected for your taste</p>

            <h3>Your Personal Recommendations</h3>

            <span>
              {recommendedItems.length} recommendations
            </span>
          </div>

          <div className="product-grid">
            {recommendedItems.map((item) =>
              renderProductCard(item)
            )}
          </div>
        </section>
      </>
    )}
  </section>
);

  // -------------------- NAVIGATION --------------------

  const openShop = () => {
    setCurrentView("shop");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const openShopOnline = (item) => {
  setShopOnlineItem(item);
};

const closeShopOnline = () => {
  setShopOnlineItem(null);
};

  const openWishlist = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setCurrentView("wishlist");
    await loadWishlist();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openStylist = () => {
    setCurrentView("stylist");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const openUpload = () => {
  if (!user) {
    setShowAuth(true);
    return;
  }

  setCurrentView("upload");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

  // -------------------- SHOP CONTROLS --------------------

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
    setPage((currentPage) =>
      Math.max(currentPage - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleNext = () => {
    setPage((currentPage) =>
      Math.min(currentPage + 1, totalPages)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -------------------- IMAGE FALLBACK --------------------

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "https://placehold.co/400x500?text=Image+Unavailable";
  };

  // -------------------- USER ACTIONS --------------------

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
        `${API_BASE}/api/users/${user.userId}/likes/${item.id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update favourites."
        );
      }

      const updatedUser = {
        ...user,
        likedItems: data.likedItems || [],
      };

      setUser(updatedUser);

      localStorage.setItem(
        "vivereUser",
        JSON.stringify(updatedUser)
      );

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

  // -------------------- PRODUCT DETAILS --------------------

  const handleOpenDetails = async (item) => {
    setShowDetails(true);
    setSelectedItem(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/items/${item.id}`
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

  // -------------------- SIMILAR PRODUCTS --------------------

  const handleFindSimilar = async (item) => {
    setSimilarSource(item);
    setSimilarItems([]);
    setSimilarError("");
    setSimilarLoading(true);
    setShowSimilar(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/agent/similar/${item.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to find similar items."
        );
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

  // -------------------- STYLIST CONTROLS --------------------

  const toggleStylistChoice = (
    value,
    currentValues,
    setter
  ) => {
    if (currentValues.includes(value)) {
      setter(
        currentValues.filter(
          (currentValue) => currentValue !== value
        )
      );
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleStylistSubmit = async (event) => {
    event.preventDefault();

    setStylistLoading(true);
    setStylistError("");
    setStylistHasRun(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gender: stylistGender,
            colours: stylistColours,
            usage: stylistUsage,
            season: stylistSeason,
            articleTypes: stylistArticleTypes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create your recommendations."
        );
      }

      setStylistItems(data.items || []);
    } catch (error) {
      console.error("Stylist error:", error);
      setStylistItems([]);
      setStylistError(error.message);
    } finally {
      setStylistLoading(false);
    }
  };

  const resetStylist = () => {
    setStylistGender("");
    setStylistColours([]);
    setStylistUsage("");
    setStylistSeason("");
    setStylistArticleTypes([]);
    setStylistItems([]);
    setStylistError("");
    setStylistHasRun(false);
  };
  

  // -------------------- PRODUCT CARD --------------------
  const getItemImageUrl = (item) => {
  if (item.imageUrl) {
    return `${API_BASE}${item.imageUrl}`;
  }

  return `/images/${item.id}.jpg`;
};

  const renderProductCard = (
    item,
    wishlistCard = false
  ) => {
    const isLiked = user?.likedItems?.some(
      (likedItemId) => Number(likedItemId) === Number(item.id)
    );

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
              src={getItemImageUrl(item)}
              alt={item.productDisplayName}
              onError={handleImageError}
            />
          </div>
        </button>

        <div className="product-content">
          <p className="product-category">
            {item.subCategory}
          </p>

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

          {item.recommendationScore !== undefined && (
            <div className="product-details">
              <span>
                Match score: {item.recommendationScore}
              </span>
            </div>
          )}

          <div className="card-actions">
            <button
              type="button"
              className={
                isLiked
                  ? "like-button liked"
                  : "like-button"
              }
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
            <button
             type="button"
             className="item-card-button"
             onClick={() => openShopOnline(item)}
             >
              🛒 Shop Similar
              </button>
          </div>
        </div>
      </article>
    );
  };

  // -------------------- SHOP VIEW --------------------

  const renderShop = () => (
    <>
      <form
        className="search-section"
        onSubmit={handleSearch}
      >
        <input
          type="search"
          placeholder="Search black tops, dresses, shoes..."
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
        />

        <button
          type="submit"
          className="search-button"
        >
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
            handleFilterChange(
              setGender,
              event.target.value
            )
          }
        >
          <option value="">All genders</option>

          {stylistOptions.genders.map(
            (genderOption) => (
              <option
                value={genderOption}
                key={genderOption}
              >
                {genderOption}
              </option>
            )
          )}
        </select>

        <select
          value={colour}
          onChange={(event) =>
            handleFilterChange(
              setColour,
              event.target.value
            )
          }
        >
          <option value="">All colours</option>

          {stylistOptions.colours.map(
            (colourOption) => (
              <option
                value={colourOption}
                key={colourOption}
              >
                {colourOption}
              </option>
            )
          )}
        </select>

        <select
          value={season}
          onChange={(event) =>
            handleFilterChange(
              setSeason,
              event.target.value
            )
          }
        >
          <option value="">All seasons</option>

          {stylistOptions.seasons.map(
            (seasonOption) => (
              <option
                value={seasonOption}
                key={seasonOption}
              >
                {seasonOption}
              </option>
            )
          )}
        </select>

        <select
          value={usage}
          onChange={(event) =>
            handleFilterChange(
              setUsage,
              event.target.value
            )
          }
        >
          <option value="">All uses</option>

          {stylistOptions.usages.map(
            (usageOption) => (
              <option
                value={usageOption}
                key={usageOption}
              >
                {usageOption}
              </option>
            )
          )}
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
                for{" "}
                <strong>
                  “{activeSearch}”
                </strong>
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
          {items.map((item) =>
            renderProductCard(item)
          )}
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
  );

  // -------------------- WISHLIST VIEW --------------------

  const renderWishlist = () => (
    <section className="wishlist-view">
      <div className="wishlist-heading">
        <div>
          <p className="wishlist-eyebrow">
            Your saved fashion
          </p>

          <h2>My Wishlist</h2>

          <p>
            {wishlistItems.length}{" "}
            {wishlistItems.length === 1
              ? "item"
              : "items"}{" "}
            saved
          </p>
        </div>

        <button
          type="button"
          className="back-to-shop-button"
          onClick={openShop}
        >
          ← Back to shop
        </button>
      </div>

      {wishlistLoading ? (
        <p className="status-message">
          Loading your wishlist...
        </p>
      ) : wishlistError ? (
        <p className="status-message">
          {wishlistError}
        </p>
      ) : wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <h3>Your wishlist is empty</h3>

          <p>
            Like products in the shop and they will
            appear here.
          </p>

          <button
            type="button"
            className="search-button"
            onClick={openShop}
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
  );

  // -------------------- STYLIST VIEW --------------------

  const renderStylist = () => (
    <section className="stylist-view">
      <div className="stylist-heading">
        <div>
          <p className="stylist-eyebrow">
            Personal recommendation engine
          </p>

          <h2>Vivere Personal Stylist</h2>

          <p>
            Select your preferences and Vivere will
            search the fashion dataset for a personalised
            collection.
          </p>
        </div>

        <button
          type="button"
          className="back-to-shop-button"
          onClick={openShop}
        >
          ← Back to shop
        </button>
      </div>

      {stylistOptionsLoading ? (
        <p className="status-message">
          Loading stylist options...
        </p>
      ) : stylistOptionsError ? (
        <p className="status-message">
          {stylistOptionsError}
        </p>
      ) : (
        <form
          className="stylist-form"
          onSubmit={handleStylistSubmit}
        >
          <div className="stylist-field">
            <label htmlFor="stylist-gender">
              Who are you shopping for?
            </label>

            <select
              id="stylist-gender"
              value={stylistGender}
              onChange={(event) =>
                setStylistGender(event.target.value)
              }
            >
              <option value="">Any gender</option>

              {stylistOptions.genders.map(
                (genderOption) => (
                  <option
                    value={genderOption}
                    key={genderOption}
                  >
                    {genderOption}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="stylist-field">
            <label htmlFor="stylist-usage">
              What is the occasion?
            </label>

            <select
              id="stylist-usage"
              value={stylistUsage}
              onChange={(event) =>
                setStylistUsage(event.target.value)
              }
            >
              <option value="">Any occasion</option>

              {stylistOptions.usages.map(
                (usageOption) => (
                  <option
                    value={usageOption}
                    key={usageOption}
                  >
                    {usageOption}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="stylist-field">
            <label htmlFor="stylist-season">
              Preferred season
            </label>

            <select
              id="stylist-season"
              value={stylistSeason}
              onChange={(event) =>
                setStylistSeason(event.target.value)
              }
            >
              <option value="">Any season</option>

              {stylistOptions.seasons.map(
                (seasonOption) => (
                  <option
                    value={seasonOption}
                    key={seasonOption}
                  >
                    {seasonOption}
                  </option>
                )
              )}
            </select>
          </div>

          <fieldset className="stylist-choice-group">
            <legend>Favourite colours</legend>

            <p>
              Choose one or several colours.
            </p>

            <div className="stylist-choice-grid">
              {stylistOptions.colours.map(
                (colourOption) => {
                  const selected =
                    stylistColours.includes(
                      colourOption
                    );

                  return (
                    <button
                      type="button"
                      key={colourOption}
                      className={
                        selected
                          ? "stylist-choice selected"
                          : "stylist-choice"
                      }
                      onClick={() =>
                        toggleStylistChoice(
                          colourOption,
                          stylistColours,
                          setStylistColours
                        )
                      }
                    >
                      {selected ? "✓ " : ""}
                      {colourOption}
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>

          <fieldset className="stylist-choice-group">
            <legend>
              Items you want to discover
            </legend>

            <p>
              Choose as many product types as you like.
            </p>

            <div className="stylist-choice-grid">
              {stylistOptions.articleTypes.map(
                (articleOption) => {
                  const selected =
                    stylistArticleTypes.includes(
                      articleOption
                    );

                  return (
                    <button
                      type="button"
                      key={articleOption}
                      className={
                        selected
                          ? "stylist-choice selected"
                          : "stylist-choice"
                      }
                      onClick={() =>
                        toggleStylistChoice(
                          articleOption,
                          stylistArticleTypes,
                          setStylistArticleTypes
                        )
                      }
                    >
                      {selected ? "✓ " : ""}
                      {articleOption}
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>

          <div className="stylist-form-actions">
            <button
              type="submit"
              className="stylist-submit-button"
              disabled={stylistLoading}
            >
              {stylistLoading
                ? "Creating your collection..."
                : "✨ Create My Style"}
            </button>

            <button
              type="button"
              className="stylist-reset-button"
              onClick={resetStylist}
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {stylistLoading ? (
        <p className="status-message">
          Searching the dataset for your style...
        </p>
      ) : stylistError ? (
        <p className="status-message">
          {stylistError}
        </p>
      ) : stylistHasRun &&
        stylistItems.length === 0 ? (
        <div className="stylist-empty">
          <h3>No matches were found</h3>

          <p>
            Try removing one preference or choosing
            additional colours.
          </p>
        </div>
      ) : stylistItems.length > 0 ? (
        <section className="stylist-results">
          <div className="stylist-results-heading">
            <p>Curated for you</p>

            <h3>Your Vivere Collection</h3>

            <span>
              {stylistItems.length} recommendations
            </span>
          </div>

          <div className="product-grid">
            {stylistItems.map((item) =>
              renderProductCard(item)
            )}
          </div>
        </section>
      ) : null}
    </section>
  );

  // -------------------- MAIN RETURN --------------------

  return (
    <div className="app">
      <header className="header">
        <button
          type="button"
          className="brand-button"
          onClick={openShop}
        >
          <h1>Vivere</h1>

          <p>
            Discover fashion selected for your style.
          </p>
        </button>

        <div className="header-actions">
          <button
            type="button"
            className="stylist-header-button"
            onClick={openStylist}
          >
            ✨ Personal Stylist
          </button>
          <button
          type="button"
          className="stylist-header-button"
          onClick={openUpload}
          >
            ＋ Upload
          </button>

          {user ? (
            <div className="user-controls">
              <span>
                Hello, {user.username}
              </span>
              <button
              type="button"
              className="stylist-header-button"
              onClick={openRecommendations}
              >
                ✨ For You
              </button>

              <button
                type="button"
                className="wishlist-button"
                onClick={openWishlist}
              >
                ♥ Wishlist (
                {user.likedItems?.length || 0})
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
        </div>
      </header>

      <main>
        {currentView === "shop" && renderShop()}

        {currentView === "wishlist" &&
          renderWishlist()}

        {currentView === "stylist" &&
          renderStylist()}
        {currentView === "recommendations" &&
  renderRecommendations()}
  
{currentView === "upload" && (
  <UploadPage
    user={user}
    onBack={openShop}
    onUploaded={(uploadedItem) => {
      setItems((currentItems) => [
        uploadedItem,
        ...currentItems,
      ]);
    }}
  />
)}

  
      </main>

      {showAuth && (
        <AuthPage
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            localStorage.setItem(
              "vivereUser",
              JSON.stringify(loggedInUser)
            );
            setShowAuth(false);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}

      {showDetails && (
        <div
          className="details-overlay"
          onClick={closeDetailsModal}
        >
          <div
            className="details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
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
              <p className="status-message">
                {detailsError}
              </p>
            ) : selectedItem ? (
              <div className="details-layout">
                <div className="details-image">
                  <img
                    src={getItemImageUrl(selectedItem)}
                    alt={
                      selectedItem.productDisplayName
                    }
                    onError={handleImageError}
                  />
                </div>

                <div className="details-content">
                  <p className="details-category">
                    {selectedItem.masterCategory} /{" "}
                    {selectedItem.subCategory}
                  </p>

                  <h2>
                    {selectedItem.productDisplayName}
                  </h2>

                  <div className="details-information">
                    <div>
                      <span>Article type</span>
                      <strong>
                        {selectedItem.articleType}
                      </strong>
                    </div>

                    <div>
                      <span>Colour</span>
                      <strong>
                        {selectedItem.baseColour}
                      </strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>
                        {selectedItem.gender}
                      </strong>
                    </div>

                    <div>
                      <span>Season</span>
                      <strong>
                        {selectedItem.season ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Usage</span>
                      <strong>
                        {selectedItem.usage ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Year</span>
                      <strong>
                        {selectedItem.year ||
                          "Not specified"}
                      </strong>
                    </div>
                  </div>

                  <div className="details-actions">
                    <button
                      type="button"
                      className={
                        user?.likedItems?.some(
                          (likedItemId) =>
                            Number(likedItemId) ===
                            Number(selectedItem.id)
                        )
                          ? "like-button liked"
                          : "like-button"
                      }
                      onClick={() =>
                        handleLike(selectedItem)
                      }
                    >
                      {user?.likedItems?.some(
                        (likedItemId) =>
                          Number(likedItemId) ===
                          Number(selectedItem.id)
                      )
                        ? "♥ Liked"
                        : "♡ Add to wishlist"}
                    </button>

                    <button
                      type="button"
                      className="similar-button"
                      onClick={() => {
                        const itemToCompare =
                          selectedItem;

                        closeDetailsModal();
                        handleFindSimilar(
                          itemToCompare
                        );
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
        <div
          className="similar-overlay"
          onClick={closeSimilarModal}
        >
          <div
            className="similar-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
     
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
              <p className="status-message">
                {similarError}
              </p>
            ) : similarItems.length === 0 ? (
              <p className="status-message">
                No similar items found.
              </p>
            ) : (
              <div className="similar-grid">
                {similarItems.map(
                  (similarItem) => {
                    const isLiked =
                      user?.likedItems?.some(
                        (likedItemId) =>
                          Number(likedItemId) ===
                          Number(similarItem.id)
                      );

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
                            handleOpenDetails(
                              similarItem
                            );
                          }}
                        >
                          <img
                            src={getItemImageUrl(similarItem)}
                            alt={
                              similarItem.productDisplayName
                            }
                            onError={handleImageError}
                          />
                        </button>

                        <div className="similar-card-content">
                          <p>
                            {similarItem.articleType}
                          </p>

                          <button
                            type="button"
                            className="similar-title-button"
                            onClick={() => {
                              closeSimilarModal();
                              handleOpenDetails(
                                similarItem
                              );
                            }}
                          >
                            {
                              similarItem.productDisplayName
                            }
                          </button>

                          <div className="similar-card-tags">
                            <span>
                              {similarItem.baseColour}
                            </span>

                            <span>
                              {similarItem.gender}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={
                              isLiked
                                ? "like-button liked"
                                : "like-button"
                            }
                            onClick={() =>
                              handleLike(similarItem)
                            }
                          >
                            {isLiked
                              ? "♥ Liked"
                              : "♡ Like"}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      )}
        {shopOnlineItem && (
        <ShopOnlineModal
          item={shopOnlineItem}
          onClose={closeShopOnline}
        />
      )}
      
    </div>
  );
}

export default App;