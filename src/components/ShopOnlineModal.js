const buildSearchText = (item) => {
  return [
    item.baseColour,
    item.gender,
    item.articleType,
    item.productDisplayName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

function ShopOnlineModal({ item, onClose }) {
  if (!item) {
    return null;
  }

  const searchText = buildSearchText(item);
  const encodedSearch = encodeURIComponent(searchText);

  const stores = [
    {
      name: "Google Shopping",
      description: "Compare products from multiple online stores.",
      url: `https://www.google.com/search?tbm=shop&q=${encodedSearch}`,
    },
    {
      name: "ASOS",
      description: "Search ASOS for a similar fashion item.",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `site:asos.com ${searchText}`
      )}`,
    },
    {
      name: "Zara",
      description: "Search Zara for products matching this style.",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `site:zara.com ${searchText}`
      )}`,
    },
    {
      name: "H&M",
      description: "Search H&M for something similar.",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `site:hm.com ${searchText}`
      )}`,
    },
    {
      name: "Amazon",
      description: "Search Amazon for comparable products.",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `site:amazon.com ${searchText}`
      )}`,
    },
  ];

  const imageUrl = item.imageUrl
    ? `http://localhost:5000${item.imageUrl}`
    : `/images/${item.id}.jpg`;

  return (
    <div className="similar-overlay" onClick={onClose}>
      <div
        className="similar-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="similar-close"
          onClick={onClose}
          aria-label="Close online shopping window"
        >
          ×
        </button>

        <div className="similar-heading">
          <p>Shop something similar to</p>
          <h2>{item.productDisplayName}</h2>
        </div>

        <div className="shop-online-layout">
          <div className="shop-online-product">
            <img
              src={imageUrl}
              alt={item.productDisplayName}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  "https://placehold.co/400x500?text=Image+Unavailable";
              }}
            />

            <div className="product-details">
              <span>{item.baseColour}</span>
              <span>{item.articleType}</span>
              <span>{item.gender}</span>
            </div>
          </div>

          <div className="shop-online-results">
            <p>
              Matches will search online stores using:
            </p>

            <strong>{searchText}</strong>

            <div className="shop-online-store-list">
              {stores.map((store) => (
                <a
                  key={store.name}
                  className="shop-online-store"
                  href={store.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <h3>{store.name}</h3>
                    <p>{store.description}</p>
                  </div>

                  <span>Search →</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopOnlineModal;