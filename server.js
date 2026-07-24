const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User");

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

// -------------------- CLOTHING MODEL --------------------

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

// -------------------- TEST ROUTE --------------------

app.get("/", (req, res) => {
  res.json({
    status: "Success",
    message: "Vivere API is running",
  });
});

// -------------------- ITEMS, SEARCH, FILTERS AND PAGINATION --------------------

app.get("/api/items", async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 12, 1),
      100
    );

    const search = (req.query.search || "").trim();
    const gender = (req.query.gender || "").trim();
    const category = (req.query.category || "").trim();
    const colour = (req.query.colour || "").trim();
    const season = (req.query.season || "").trim();
    const usage = (req.query.usage || "").trim();

    const filters = [];

    if (search) {
      filters.push({
        $or: [
          { productDisplayName: { $regex: search, $options: "i" } },
          { articleType: { $regex: search, $options: "i" } },
          { subCategory: { $regex: search, $options: "i" } },
          { masterCategory: { $regex: search, $options: "i" } },
          { baseColour: { $regex: search, $options: "i" } },
          { gender: { $regex: search, $options: "i" } },
          { usage: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (gender) {
      filters.push({ gender });
    }

    if (category) {
      filters.push({
        $or: [
          { masterCategory: category },
          { subCategory: category },
          { articleType: category },
        ],
      });
    }

    if (colour) {
      filters.push({ baseColour: colour });
    }

    if (season) {
      filters.push({ season });
    }

    if (usage) {
      filters.push({ usage });
    }

    const databaseFilter =
      filters.length > 0
        ? {
            $and: filters,
          }
        : {};

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      ClothingItem.find(databaseFilter)
        .sort({ id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      ClothingItem.countDocuments(databaseFilter),
    ]);

    res.json({
      status: "Success",
      page,
      limit,
      search,
      filters: {
        gender,
        category,
        colour,
        season,
        usage,
      },
      totalItems,
      totalPages: Math.max(Math.ceil(totalItems / limit), 1),
      items,
    });
  } catch (error) {
    console.error("Feed and filter error:", error);

    res.status(500).json({
      status: "Error",
      error: "Unable to load filtered clothing items.",
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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required.",
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username or email already exists.",
      });
    }

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      likedItems: [],
    });

    await user.save();

    res.status(201).json({
      status: "Success",
      message: "User registered successfully.",
      userId: user._id,
      username: user.username,
      email: user.email,
      likedItems: user.likedItems,
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
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        error: "Username or email and password are required.",
      });
    }

    const loginValue = usernameOrEmail.trim();

    const user = await User.findOne({
      $or: [
        { username: loginValue },
        { email: loginValue.toLowerCase() },
      ],
      password,
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid login details.",
      });
    }

    res.json({
      status: "Success",
      userId: user._id,
      username: user.username,
      email: user.email,
      likedItems: user.likedItems,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Unable to log in.",
    });
  }
});

// -------------------- LIKE OR UNLIKE ITEM --------------------

app.post("/api/users/:userId/likes/:itemId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const itemId = Number.parseInt(req.params.itemId, 10);

    if (Number.isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const alreadyLiked = user.likedItems.includes(itemId);

    if (alreadyLiked) {
      user.likedItems = user.likedItems.filter(
        (likedItemId) => likedItemId !== itemId
      );
    } else {
      user.likedItems.push(itemId);
    }

    await user.save();

    res.json({
      status: "Success",
      liked: !alreadyLiked,
      likedItems: user.likedItems,
    });
  } catch (error) {
    console.error("Like error:", error);

    res.status(500).json({
      error: "Unable to update liked items.",
    });
  }
});
// -------------------- START SERVER --------------------

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Vivere server running on port ${PORT}`);
});