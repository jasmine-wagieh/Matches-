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

const ClothingItem = mongoose.model(
  "ClothingItem",
  clothingItemSchema
);

// -------------------- HELPERS --------------------

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalise = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const matchesText = (actualValue, selectedValue) => {
  const actual = normalise(actualValue);
  const selected = normalise(selectedValue);

  if (!selected) {
    return false;
  }

  return actual === selected ||
    actual.includes(selected) ||
    selected.includes(actual);
};

const shuffle = (array) => {
  const result = [...array];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
};

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
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 12,
        1
      ),
      100
    );

    const search = String(req.query.search || "").trim();
    const gender = String(req.query.gender || "").trim();
    const category = String(req.query.category || "").trim();
    const colour = String(req.query.colour || "").trim();
    const season = String(req.query.season || "").trim();
    const usage = String(req.query.usage || "").trim();

    const filters = [];

    if (search) {
      const searchRegex = new RegExp(
        escapeRegex(search),
        "i"
      );

      filters.push({
        $or: [
          { productDisplayName: searchRegex },
          { articleType: searchRegex },
          { subCategory: searchRegex },
          { masterCategory: searchRegex },
          { baseColour: searchRegex },
          { gender: searchRegex },
          { usage: searchRegex },
          { season: searchRegex },
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
        ? { $and: filters }
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
      totalPages: Math.max(
        Math.ceil(totalItems / limit),
        1
      ),
      items,
    });
  } catch (error) {
    console.error("Feed and filter error:", error);

    res.status(500).json({
      status: "Error",
      error: "Unable to load clothing items.",
    });
  }
});

// -------------------- SINGLE ITEM --------------------

app.get("/api/items/:id", async (req, res) => {
  try {
    const itemId = Number.parseInt(
      req.params.id,
      10
    );

    if (Number.isNaN(itemId)) {
      return res.status(400).json({
        error: "Invalid item ID.",
      });
    }

    const item = await ClothingItem.findOne({
      id: itemId,
    }).lean();

    if (!item) {
      return res.status(404).json({
        error: "Item not found.",
      });
    }

    return res.json({
      status: "Success",
      item,
    });
  } catch (error) {
    console.error("Item error:", error);

    return res.status(500).json({
      error: "Unable to load this item.",
    });
  }
});

// -------------------- SIMILAR ITEMS --------------------

app.get("/api/agent/similar/:id", async (req, res) => {
  try {
    const itemId = Number.parseInt(
      req.params.id,
      10
    );

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

    const candidates = await ClothingItem.find({
      id: { $ne: parentItem.id },
      gender: parentItem.gender,
      $or: [
        { articleType: parentItem.articleType },
        { subCategory: parentItem.subCategory },
      ],
    })
      .limit(300)
      .lean();

    const scoredCandidates = candidates
      .map((item) => {
        let score = 0;

        if (item.articleType === parentItem.articleType) {
          score += 5;
        }

        if (item.subCategory === parentItem.subCategory) {
          score += 3;
        }

        if (item.baseColour === parentItem.baseColour) {
          score += 2;
        }

        if (item.usage === parentItem.usage) {
          score += 2;
        }

        if (item.season === parentItem.season) {
          score += 1;
        }

        return {
          ...item,
          similarityScore: score,
        };
      })
      .sort((firstItem, secondItem) =>
        secondItem.similarityScore -
        firstItem.similarityScore
      );

    const topScore =
      scoredCandidates[0]?.similarityScore || 0;

    const strongestMatches = scoredCandidates.filter(
      (item) =>
        item.similarityScore >=
        Math.max(topScore - 2, 1)
    );

    const recommendations = shuffle(
      strongestMatches
    ).slice(0, 6);

    return res.json({
      status: "Success",
      parentItem,
      recommendations,
    });
  } catch (error) {
    console.error("Similarity error:", error);

    return res.status(500).json({
      error: "Unable to find similar items.",
    });
  }
});

// -------------------- PERSONAL STYLIST --------------------

app.post("/api/recommendation", async (req, res) => {
  try {
    const {
      gender = "",
      colours = [],
      usage = "",
      season = "",
      articleTypes = [],
    } = req.body;

    console.log("STYLIST REQUEST:", {
      gender,
      colours,
      usage,
      season,
      articleTypes,
    });

    const safeColours = Array.isArray(colours)
      ? colours.filter(Boolean)
      : [];

    const safeArticleTypes = Array.isArray(
      articleTypes
    )
      ? articleTypes.filter(Boolean)
      : [];

    /*
      Gender is used as the broad candidate filter because
      recommending products for a different gender is usually
      undesirable. The other preferences are scored so that
      results do not become empty when the form is restrictive.
    */
    const candidateFilter = {};

    if (gender) {
      candidateFilter.gender = gender;
    }

    let candidateItems = await ClothingItem.find(
      candidateFilter
    )
      .lean();

    /*
      Fallback for dataset values such as "Unisex".
      If an exact gender gives too few candidates, include
      unisex products as well.
    */
    if (gender && candidateItems.length < 100) {
      candidateItems = await ClothingItem.find({
        gender: {
          $in: [gender, "Unisex"],
        },
      }).lean();
    }

    const hasPreferences =
      Boolean(gender) ||
      safeColours.length > 0 ||
      Boolean(usage) ||
      Boolean(season) ||
      safeArticleTypes.length > 0;

    const scoredItems = candidateItems.map((item) => {
      let score = 0;
      const matchedPreferences = [];

      if (gender && matchesText(item.gender, gender)) {
        score += 3;
        matchedPreferences.push("gender");
      }

      const matchingColour = safeColours.some(
        (selectedColour) =>
          matchesText(
            item.baseColour,
            selectedColour
          )
      );

      if (matchingColour) {
        score += 5;
        matchedPreferences.push("colour");
      }

      if (usage && matchesText(item.usage, usage)) {
        score += 4;
        matchedPreferences.push("occasion");
      }

      if (
        season &&
        matchesText(item.season, season)
      ) {
        score += 3;
        matchedPreferences.push("season");
      }

      const matchingArticleType =
        safeArticleTypes.some(
          (selectedType) =>
            matchesText(
              item.articleType,
              selectedType
            ) ||
            matchesText(
              item.subCategory,
              selectedType
            ) ||
            matchesText(
              item.masterCategory,
              selectedType
            )
        );

      if (matchingArticleType) {
        score += 7;
        matchedPreferences.push("item type");
      }

      return {
        ...item,
        recommendationScore: score,
        matchedPreferences,
      };
    });

    /*
      Require at least one meaningful match. Gender by itself is
      kept as a valid match, but colour/type matches rank higher.
    */
    const matchedItems = scoredItems.filter(
      (item) =>
        !hasPreferences ||
        item.recommendationScore > 0
    );

    const sortedItems = matchedItems.sort(
      (firstItem, secondItem) =>
        secondItem.recommendationScore -
        firstItem.recommendationScore
    );

    /*
      Randomise among products with the strongest scores so a
      repeated request does not always display the same 12 IDs.
    */
    const highestScore =
      sortedItems[0]?.recommendationScore || 0;

    let recommendationPool = sortedItems.filter(
      (item) =>
        item.recommendationScore >=
        Math.max(highestScore - 2, 1)
    );

    if (recommendationPool.length < 12) {
      recommendationPool = sortedItems.slice(0, 150);
    }

    let finalItems = shuffle(
      recommendationPool
    ).slice(0, 12);

    /*
      If no preference produced matches, return a random sample
      rather than repeatedly returning the first 12 database rows.
    */
    if (finalItems.length === 0) {
      finalItems = await ClothingItem.aggregate([
        {
          $match: candidateFilter,
        },
        {
          $sample: {
            size: 12,
          },
        },
      ]);
    }

    return res.json({
      status: "Success",
      totalItems: finalItems.length,
      preferences: {
        gender,
        colours: safeColours,
        usage,
        season,
        articleTypes: safeArticleTypes,
      },
      items: finalItems,
    });
  } catch (error) {
    console.error(
      "Stylist recommendation error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to generate stylist recommendations.",
    });
  }
});

// -------------------- REGISTER --------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error:
          "Username, email and password are required.",
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          "Username or email already exists.",
      });
    }

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      likedItems: [],
    });

    await user.save();

    return res.status(201).json({
      status: "Success",
      message: "User registered successfully.",
      userId: user._id,
      username: user.username,
      email: user.email,
      likedItems: user.likedItems,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Unable to register user.",
    });
  }
});

// -------------------- LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } =
      req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        error:
          "Username or email and password are required.",
      });
    }

    const loginValue =
      usernameOrEmail.trim();

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

    return res.json({
      status: "Success",
      userId: user._id,
      username: user.username,
      email: user.email,
      likedItems: user.likedItems || [],
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Unable to log in.",
    });
  }
});

// -------------------- LIKE OR UNLIKE ITEM --------------------

app.post(
  "/api/users/:userId/likes/:itemId",
  async (req, res) => {
    try {
      const { userId } = req.params;
      const itemId = Number.parseInt(
        req.params.itemId,
        10
      );

      if (
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(400).json({
          error: "Invalid user ID.",
        });
      }

      if (Number.isNaN(itemId)) {
        return res.status(400).json({
          error: "Invalid item ID.",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error:
            "User not found. Please log in again.",
        });
      }

      if (!Array.isArray(user.likedItems)) {
        user.likedItems = [];
      }

      const alreadyLiked = user.likedItems.some(
        (likedItemId) =>
          Number(likedItemId) === itemId
      );

      if (alreadyLiked) {
        user.likedItems =
          user.likedItems.filter(
            (likedItemId) =>
              Number(likedItemId) !== itemId
          );
      } else {
        user.likedItems.push(itemId);
      }

      await user.save();

      return res.json({
        status: "Success",
        liked: !alreadyLiked,
        likedItems: user.likedItems,
      });
    } catch (error) {
      console.error("Like error:", error);

      return res.status(500).json({
        error:
          error.message ||
          "Unable to update liked items.",
      });
    }
  }
);

// -------------------- GET WISHLIST --------------------

app.get(
  "/api/users/:userId/likes",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(400).json({
          error: "Invalid user ID.",
        });
      }

      const user = await User.findById(
        userId
      ).lean();

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const likedItemIds = Array.isArray(
        user.likedItems
      )
        ? user.likedItems
        : [];

      const items = await ClothingItem.find({
        id: {
          $in: likedItemIds,
        },
      }).lean();

      /*
        Preserve the order in which the user liked the products.
      */
      const itemMap = new Map(
        items.map((item) => [item.id, item])
      );

      const orderedItems = likedItemIds
        .map((itemId) =>
          itemMap.get(Number(itemId))
        )
        .filter(Boolean);

      return res.json({
        status: "Success",
        totalItems: orderedItems.length,
        items: orderedItems,
      });
    } catch (error) {
      console.error("Wishlist error:", error);

      return res.status(500).json({
        error: "Unable to load wishlist.",
      });
    }
  }
);

// -------------------- 404 JSON RESPONSE --------------------

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// -------------------- START SERVER --------------------

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Vivere server running on port ${PORT}`
  );
});