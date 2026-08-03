import { useState } from "react";

const API_BASE = "http://localhost:5000";

function UploadPage({ user, onBack, onUploaded }) {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [productDisplayName, setProductDisplayName] =
    useState("");
  const [gender, setGender] = useState("Unisex");
  const [masterCategory, setMasterCategory] =
    useState("Apparel");
  const [subCategory, setSubCategory] = useState("");
  const [articleType, setArticleType] = useState("");
  const [baseColour, setBaseColour] = useState("");
  const [season, setSeason] = useState("All Seasons");
  const [usage, setUsage] = useState("Casual");

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccessMessage("");

    if (!selectedFile) {
      setImage(null);
      setPreviewUrl("");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setImage(null);
      setPreviewUrl("");
      setError("Please select an image file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setImage(null);
      setPreviewUrl("");
      setError("The image must be smaller than 5 MB.");
      return;
    }

    setImage(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const resetForm = () => {
    setImage(null);
    setPreviewUrl("");
    setProductDisplayName("");
    setGender("Unisex");
    setMasterCategory("Apparel");
    setSubCategory("");
    setArticleType("");
    setBaseColour("");
    setSeason("All Seasons");
    setUsage("Casual");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!image) {
      setError("Please choose an image.");
      return;
    }

    if (!productDisplayName.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!articleType.trim()) {
      setError("Please enter an article type.");
      return;
    }

    const formData = new FormData();

    formData.append("image", image);
    formData.append(
      "productDisplayName",
      productDisplayName.trim()
    );
    formData.append("gender", gender);
    formData.append("masterCategory", masterCategory);
    formData.append("subCategory", subCategory.trim());
    formData.append("articleType", articleType.trim());
    formData.append("baseColour", baseColour.trim());
    formData.append("season", season);
    formData.append("usage", usage);
    formData.append("uploadedBy", user?.userId || "");

    setUploading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/uploads`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to upload this item."
        );
      }

      setSuccessMessage(
        "Your clothing item was uploaded successfully."
      );

      if (onUploaded) {
        onUploaded(data.item);
      }

      resetForm();
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="upload-view">
      <div className="wishlist-heading">
        <div>
          <p className="wishlist-eyebrow">
            Add to the Vivere collection
          </p>

          <h2>Upload Clothing</h2>

          <p>
            Upload a fashion item and add information that
            helps Vivere include it in search and
            recommendations.
          </p>
        </div>

        <button
          type="button"
          className="back-to-shop-button"
          onClick={onBack}
        >
          ← Back to shop
        </button>
      </div>

      <form
        className="stylist-form"
        onSubmit={handleSubmit}
      >
        <div className="stylist-field">
          <label htmlFor="upload-image">
            Clothing image *
          </label>

          <input
            id="upload-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        {previewUrl && (
          <div className="upload-preview">
            <img
              src={previewUrl}
              alt="Selected clothing preview"
            />
          </div>
        )}

        <div className="stylist-field">
          <label htmlFor="upload-name">
            Product name *
          </label>

          <input
            id="upload-name"
            type="text"
            value={productDisplayName}
            placeholder="Example: Blue summer dress"
            onChange={(event) =>
              setProductDisplayName(event.target.value)
            }
          />
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-article-type">
            Article type *
          </label>

          <input
            id="upload-article-type"
            type="text"
            value={articleType}
            placeholder="Example: Dresses, Shirts, Handbags"
            onChange={(event) =>
              setArticleType(event.target.value)
            }
          />
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-subcategory">
            Subcategory
          </label>

          <input
            id="upload-subcategory"
            type="text"
            value={subCategory}
            placeholder="Example: Topwear, Shoes, Bags"
            onChange={(event) =>
              setSubCategory(event.target.value)
            }
          />
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-colour">
            Colour
          </label>

          <input
            id="upload-colour"
            type="text"
            value={baseColour}
            placeholder="Example: Blue"
            onChange={(event) =>
              setBaseColour(event.target.value)
            }
          />
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-gender">
            Gender
          </label>

          <select
            id="upload-gender"
            value={gender}
            onChange={(event) =>
              setGender(event.target.value)
            }
          >
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Girls">Girls</option>
            <option value="Boys">Boys</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-master-category">
            Main category
          </label>

          <select
            id="upload-master-category"
            value={masterCategory}
            onChange={(event) =>
              setMasterCategory(event.target.value)
            }
          >
            <option value="Apparel">Apparel</option>
            <option value="Accessories">
              Accessories
            </option>
            <option value="Footwear">Footwear</option>
            <option value="Personal Care">
              Personal Care
            </option>
          </select>
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-season">
            Season
          </label>

          <select
            id="upload-season"
            value={season}
            onChange={(event) =>
              setSeason(event.target.value)
            }
          >
            <option value="All Seasons">
              All Seasons
            </option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
            <option value="Spring">Spring</option>
            <option value="Fall">Fall</option>
          </select>
        </div>

        <div className="stylist-field">
          <label htmlFor="upload-usage">
            Usage
          </label>

          <select
            id="upload-usage"
            value={usage}
            onChange={(event) =>
              setUsage(event.target.value)
            }
          >
            <option value="Casual">Casual</option>
            <option value="Formal">Formal</option>
            <option value="Sports">Sports</option>
            <option value="Travel">Travel</option>
            <option value="Party">Party</option>
          </select>
        </div>

        {error && (
          <p className="status-message">{error}</p>
        )}

        {successMessage && (
          <p className="status-message">
            {successMessage}
          </p>
        )}

        <div className="stylist-form-actions">
          <button
            type="submit"
            className="stylist-submit-button"
            disabled={uploading}
          >
            {uploading
              ? "Uploading..."
              : "Upload Clothing Item"}
          </button>

          <button
            type="button"
            className="stylist-reset-button"
            onClick={resetForm}
            disabled={uploading}
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  );
}

export default UploadPage;