const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// -------------------- DATABASE --------------------

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Vivere database connected successfully");
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });

// -------------------- MODELS --------------------

const clothingItemSchema = new mongoose.Schema(
  {
    id: Number,
    gender: String,
    masterCategory: String,
    subCategory: String,
    articleType: String,
    baseColour: String,
    season: String,
    year: Number,
    usage: String,
    productDisplayName: String,
  },
  {
    collection: "blueprints",
  }
);

const ClothingItem = mongoose.model("ClothingItem", clothingItemSchema);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  savedAesthetics: [String],
  likedItems: [Number],
});

const User = mongoose.model("User", userSchema);

// -------------------- TEST ROUTE --------------------

app.get("/", (req, res) => {
  res.json({
    status: "Success",
    message: "Vivere API is running",
  });
});

// -------------------- ITEMS, SEARCH AND PAGINATION --------------------

app.get("/api/items", async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 12, 1),
      100
    );

    const search = (req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            {
              productDisplayName: {
                $regex: search,
                $options: "i",
              },
            },
            {
              articleType: {
                $regex: search,
                $options: "i",
              },
            },
            {
              subCategory: {
                $regex: search,
                $options: "i",
              },
            },
            {
              masterCategory: {
                $regex: search,
                $options: "i",
              },
            },
            {
              baseColour: {
                $regex: search,
                $options: "i",
              },
            },
            {
              gender: {
                $regex: search,
                $options: "i",
              },
            },
            {
              usage: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      ClothingItem.find(filter)
        .sort({ id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      ClothingItem.countDocuments(filter),
    ]);

    res.json({
      status: "Success",
      page,
      limit,
      search,
      totalItems,
      totalPages: Math.max(Math.ceil(totalItems / limit), 1),
      items,
    });
  } catch (error) {
    console.error("Feed error:", error);

    res.status(500).json({
      status: "Error",
      error: "Unable to load clothing items.",
    });
  }
});

// -------------------- SINGLE ITEM --------------------

app.get("/api/items/:id", async (req, res) => {
  try {
    const itemId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID.",
      });
    }

    const item = await ClothingItem.findOne({ id: itemId }).lean();

    if (!item) {
      return res.status(404).json({
        error: "Item not found.",
      });
    }

    res.json({
      status: "Success",
      item,
    });
  } catch (error) {
    console.error("Item error:", error);

    res.status(500).json({
      error: "Unable to load this item.",
    });
  }
});

// -------------------- SIMILAR ITEMS --------------------

app.get("/api/agent/similar/:id", async (req, res) => {
  try {
    const itemId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID.",
      });
    }

    const parentItem = await ClothingItem.findOne({
      id: itemId,
    }).lean();

    if (!parentItem) {
      return res.status(404).json({
        error: "Source item not found.",
      });
    }

    const recommendations = await ClothingItem.find({
      id: {
        $ne: parentItem.id,
      },
      subCategory: parentItem.subCategory,
      articleType: parentItem.articleType,
    })
      .limit(6)
      .lean();

    res.json({
      status: "Success",
      parentItem,
      recommendations,
    });
  } catch (error) {
    console.error("Similarity error:", error);

    res.status(500).json({
      error: "Unable to find similar items.",
    });
  }
});

// -------------------- RECOMMENDATIONS --------------------

app.post("/api/recommendation", async (req, res) => {
  try {
    const { colorPalette, aesthetic } = req.body;

    let targetColors = ["Black", "White", "Grey"];

    if (colorPalette === "Warm Autumn") {
      targetColors = ["Brown", "Beige", "Tan", "Olive"];
    }

    if (colorPalette === "Cool Winter") {
      targetColors = ["Blue", "Navy Blue", "Purple", "Black"];
    }

    const items = await ClothingItem.find({
      baseColour: {
        $in: targetColors,
      },
    })
      .limit(12)
      .lean();

    res.json({
      status: "Success",
      message: `Recommendations for ${aesthetic || "selected"} style`,
      items,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      error: "Unable to generate recommendations.",
    });
  }
});

// -------------------- REGISTER --------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required.",
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        error: "Username already exists.",
      });
    }

    const user = new User({
      username,
      password,
      savedAesthetics: [],
      likedItems: [],
    });

    await user.save();

    res.status(201).json({
      status: "Success",
      message: "User registered successfully.",
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      error: "Unable to register user.",
    });
  }
});

// -------------------- LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username,
      password,
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password.",
      });
    }

    res.json({
      status: "Success",
      userId: user._id,
      username: user.username,
      likedItems: user.likedItems,
      savedAesthetics: user.savedAesthetics,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Unable to log in.",
    });
  }
});

// -------------------- START SERVER --------------------

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Vivere server running on port ${PORT}`);
});