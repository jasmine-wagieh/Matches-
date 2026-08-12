const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User");

const app = express();
const multer = require("multer");
const path = require("path");

app.use(cors());
app.use(express.json());
app.get("/api/users/:userId/recommendations-test", (req, res) => {
  return res.json({
    status: "Success",
    message: "Test recommendation route works",
    userId: req.params.userId,
  });
});
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);
// -------------------- FILE UPLOAD --------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});
// -------------------- DATABASE --------------------

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Matches database connected successfully");
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
    imageUrl: String,
    uploadedBy: String,
    isUserUpload: {
      type: Boolean,
      default: false,
    },
    
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

  return (
    actual === selected ||
    actual.includes(selected) ||
    selected.includes(actual)
  );
};

const shuffle = (array) => {
  const result = [...array];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

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
    message: "Matches API is running",
  });
});

// -------------------- ITEMS --------------------

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

    const search = String(
      req.query.search || ""
    ).trim();

    const gender = String(
      req.query.gender || ""
    ).trim();

    const category = String(
      req.query.category || ""
    ).trim();

    const colour = String(
      req.query.colour || ""
    ).trim();

    const season = String(
      req.query.season || ""
    ).trim();

    const usage = String(
      req.query.usage || ""
    ).trim();

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
      filters.push({
        baseColour: colour,
      });
    }

    if (season) {
      filters.push({
        season,
      });
    }

    if (usage) {
      filters.push({
        usage,
      });
    }

    const databaseFilter =
      filters.length > 0
        ? {
            $and: filters,
          }
        : {};

    const skip = (page - 1) * limit;

    const [items, totalItems] =
      await Promise.all([
        ClothingItem.find(databaseFilter)
          .sort({ id: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        ClothingItem.countDocuments(
          databaseFilter
        ),
      ]);

    return res.json({
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
    console.error(
      "Feed and filter error:",
      error
    );

    return res.status(500).json({
      status: "Error",
      error:
        error.message ||
        "Unable to load clothing items.",
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

    const item =
      await ClothingItem.findOne({
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
      error:
        "Unable to load this item.",
    });
  }
});

// -------------------- SIMILAR ITEMS --------------------

app.get(
  "/api/agent/similar/:id",
  async (req, res) => {
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

      const parentItem =
        await ClothingItem.findOne({
          id: itemId,
        }).lean();

      if (!parentItem) {
        return res.status(404).json({
          error:
            "Source item not found.",
        });
      }

      const candidates =
        await ClothingItem.find({
          id: {
            $ne: parentItem.id,
          },
          gender: parentItem.gender,
          $or: [
            {
              articleType:
                parentItem.articleType,
            },
            {
              subCategory:
                parentItem.subCategory,
            },
          ],
        })
          .limit(300)
          .lean();

      const scoredCandidates =
        candidates
          .map((item) => {
            let score = 0;

            if (
              item.articleType ===
              parentItem.articleType
            ) {
              score += 5;
            }

            if (
              item.subCategory ===
              parentItem.subCategory
            ) {
              score += 3;
            }

            if (
              item.baseColour ===
              parentItem.baseColour
            ) {
              score += 2;
            }

            if (
              item.usage ===
              parentItem.usage
            ) {
              score += 2;
            }

            if (
              item.season ===
              parentItem.season
            ) {
              score += 1;
            }

            return {
              ...item,
              similarityScore: score,
            };
          })
          .sort(
            (
              firstItem,
              secondItem
            ) =>
              secondItem.similarityScore -
              firstItem.similarityScore
          );

      const topScore =
        scoredCandidates[0]
          ?.similarityScore || 0;

      const strongestMatches =
        scoredCandidates.filter(
          (item) =>
            item.similarityScore >=
            Math.max(
              topScore - 2,
              1
            )
        );

      const recommendations =
        shuffle(
          strongestMatches
        ).slice(0, 6);

      return res.json({
        status: "Success",
        parentItem,
        recommendations,
      });
    } catch (error) {
      console.error(
        "Similarity error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to find similar items.",
      });
    }
  }
);

// -------------------- STYLIST OPTIONS --------------------

app.get(
  "/api/stylist/options",
  async (req, res) => {
    try {
      const [
        genders,
        colours,
        usages,
        seasons,
        articleTypes,
      ] = await Promise.all([
        ClothingItem.distinct(
          "gender"
        ),
        ClothingItem.distinct(
          "baseColour"
        ),
        ClothingItem.distinct(
          "usage"
        ),
        ClothingItem.distinct(
          "season"
        ),
        ClothingItem.distinct(
          "articleType"
        ),
      ]);

      const cleanAndSort = (
        values
      ) =>
        values
          .filter(
            (value) =>
              typeof value ===
                "string" &&
              value.trim()
          )
          .map((value) =>
            value.trim()
          )
          .sort((a, b) =>
            a.localeCompare(b)
          );

      return res.json({
        status: "Success",
        options: {
          genders:
            cleanAndSort(genders),
          colours:
            cleanAndSort(colours),
          usages:
            cleanAndSort(usages),
          seasons:
            cleanAndSort(seasons),
          articleTypes:
            cleanAndSort(
              articleTypes
            ),
        },
      });
    } catch (error) {
      console.error(
        "Stylist options error:",
        error
      );

      return res.status(500).json({
        status: "Error",
        error:
          error.message ||
          "Unable to load stylist options.",
      });
    }
  }
);

// -------------------- PERSONAL STYLIST --------------------

app.post(
  "/api/recommendation",
  async (req, res) => {
    try {
      const {
        gender = "",
        colours = [],
        usage = "",
        season = "",
        articleTypes = [],
      } = req.body;

      console.log(
        "STYLIST REQUEST:",
        {
          gender,
          colours,
          usage,
          season,
          articleTypes,
        }
      );

      const safeColours =
        Array.isArray(colours)
          ? colours.filter(Boolean)
          : [];

      const safeArticleTypes =
        Array.isArray(articleTypes)
          ? articleTypes.filter(
              Boolean
            )
          : [];

      const candidateFilter = {};

      if (gender) {
        candidateFilter.gender =
          gender;
      }

      let candidateItems =
        await ClothingItem.find(
          candidateFilter
        ).lean();

      if (
        gender &&
        candidateItems.length < 100
      ) {
        candidateItems =
          await ClothingItem.find({
            gender: {
              $in: [
                gender,
                "Unisex",
              ],
            },
          }).lean();
      }

      const hasPreferences =
        Boolean(gender) ||
        safeColours.length > 0 ||
        Boolean(usage) ||
        Boolean(season) ||
        safeArticleTypes.length >
          0;

      const scoredItems =
        candidateItems.map(
          (item) => {
            let score = 0;

            const matchedPreferences =
              [];

            if (
              gender &&
              matchesText(
                item.gender,
                gender
              )
            ) {
              score += 3;
              matchedPreferences.push(
                "gender"
              );
            }

            if (
              safeColours.some(
                (
                  selectedColour
                ) =>
                  matchesText(
                    item.baseColour,
                    selectedColour
                  )
              )
            ) {
              score += 5;
              matchedPreferences.push(
                "colour"
              );
            }

            if (
              usage &&
              matchesText(
                item.usage,
                usage
              )
            ) {
              score += 4;
              matchedPreferences.push(
                "usage"
              );
            }

            if (
              season &&
              matchesText(
                item.season,
                season
              )
            ) {
              score += 3;
              matchedPreferences.push(
                "season"
              );
            }

            if (
              safeArticleTypes.some(
                (
                  selectedType
                ) =>
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
              )
            ) {
              score += 7;
              matchedPreferences.push(
                "articleType"
              );
            }

            return {
              ...item,
              recommendationScore:
                score,
              matchedPreferences,
            };
          }
        );

      const matchedItems =
        scoredItems.filter(
          (item) =>
            !hasPreferences ||
            item.recommendationScore >
              0
        );

      const sortedItems =
        matchedItems.sort(
          (
            firstItem,
            secondItem
          ) =>
            secondItem.recommendationScore -
            firstItem.recommendationScore
        );

      const highestScore =
        sortedItems[0]
          ?.recommendationScore ||
        0;

      let recommendationPool =
        sortedItems.filter(
          (item) =>
            item.recommendationScore >=
            Math.max(
              highestScore - 2,
              1
            )
        );

      if (
        recommendationPool.length <
        12
      ) {
        recommendationPool =
          sortedItems.slice(
            0,
            150
          );
      }

      let finalItems = shuffle(
        recommendationPool
      ).slice(0, 12);

      if (
        finalItems.length === 0
      ) {
        finalItems =
          await ClothingItem.aggregate(
            [
              {
                $match:
                  candidateFilter,
              },
              {
                $sample: {
                  size: 12,
                },
              },
            ]
          );
      }

      return res.json({
        status: "Success",
        totalItems:
          finalItems.length,
        preferences: {
          gender,
          colours: safeColours,
          usage,
          season,
          articleTypes:
            safeArticleTypes,
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
          error.message ||
          "Unable to generate stylist recommendations.",
      });
    }
  }
);

// -------------------- RECOMMENDATIONS FROM LIKES --------------------
console.log("Recommendations route loaded");
app.get(
  "/api/users/:userId/recommendations",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          error: "Invalid user ID.",
        });
      }

      const user = await User.findById(userId).lean();

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const likedItemIds = Array.isArray(user.likedItems)
        ? user.likedItems.map(Number).filter(Number.isFinite)
        : [];

      if (likedItemIds.length === 0) {
        return res.json({
          status: "Success",
          message:
            "Like some products first so Matches can learn your style.",
          totalItems: 0,
          tasteProfile: null,
          items: [],
        });
      }

      const likedItems = await ClothingItem.find({
        id: {
          $in: likedItemIds,
        },
      }).lean();

      if (likedItems.length === 0) {
        return res.json({
          status: "Success",
          message:
            "No matching liked products were found in the clothing dataset.",
          totalItems: 0,
          tasteProfile: null,
          items: [],
        });
      }

      const countValues = (items, fieldName) => {
        const counts = {};

        items.forEach((item) => {
          const value = item[fieldName];

          if (
            typeof value !== "string" ||
            !value.trim()
          ) {
            return;
          }

          const cleanValue = value.trim();

          counts[cleanValue] =
            (counts[cleanValue] || 0) + 1;
        });

        return counts;
      };

      const sortCounts = (counts) =>
        Object.entries(counts).sort(
          (firstEntry, secondEntry) =>
            secondEntry[1] - firstEntry[1]
        );

      const articleTypeCounts = countValues(
        likedItems,
        "articleType"
      );

      const subCategoryCounts = countValues(
        likedItems,
        "subCategory"
      );

      const colourCounts = countValues(
        likedItems,
        "baseColour"
      );

      const usageCounts = countValues(
        likedItems,
        "usage"
      );

      const seasonCounts = countValues(
        likedItems,
        "season"
      );

      const genderCounts = countValues(
        likedItems,
        "gender"
      );

      const favouriteArticleTypes =
        sortCounts(articleTypeCounts)
          .slice(0, 5)
          .map(([value]) => value);

      const favouriteSubCategories =
        sortCounts(subCategoryCounts)
          .slice(0, 5)
          .map(([value]) => value);

      const favouriteColours =
        sortCounts(colourCounts)
          .slice(0, 5)
          .map(([value]) => value);

      const favouriteUsages =
        sortCounts(usageCounts)
          .slice(0, 3)
          .map(([value]) => value);

      const favouriteSeasons =
        sortCounts(seasonCounts)
          .slice(0, 3)
          .map(([value]) => value);

      const favouriteGenders =
        sortCounts(genderCounts)
          .slice(0, 3)
          .map(([value]) => value);

      const candidates = await ClothingItem.find({
        id: {
          $nin: likedItemIds,
        },
      })
        .limit(5000)
        .lean();

      const scoredCandidates = candidates.map(
        (item) => {
          let score = 0;
          const matchedTaste = [];

          if (articleTypeCounts[item.articleType]) {
            score +=
              articleTypeCounts[item.articleType] * 7;

            matchedTaste.push("article type");
          }

          if (subCategoryCounts[item.subCategory]) {
            score +=
              subCategoryCounts[item.subCategory] * 5;

            matchedTaste.push("category");
          }

          if (colourCounts[item.baseColour]) {
            score +=
              colourCounts[item.baseColour] * 4;

            matchedTaste.push("colour");
          }

          if (usageCounts[item.usage]) {
            score += usageCounts[item.usage] * 3;

            matchedTaste.push("usage");
          }

          if (seasonCounts[item.season]) {
            score += seasonCounts[item.season] * 2;

            matchedTaste.push("season");
          }

          if (genderCounts[item.gender]) {
            score += genderCounts[item.gender] * 2;

            matchedTaste.push("gender");
          }

          return {
            ...item,
            tasteScore: score,
            matchedTaste,
          };
        }
      );

      const matchingCandidates =
        scoredCandidates
          .filter((item) => item.tasteScore > 0)
          .sort(
            (firstItem, secondItem) =>
              secondItem.tasteScore -
              firstItem.tasteScore
          );

      const highestScore =
        matchingCandidates[0]?.tasteScore || 0;

      let recommendationPool =
        matchingCandidates.filter(
          (item) =>
            item.tasteScore >=
            Math.max(highestScore - 5, 1)
        );

      if (recommendationPool.length < 12) {
        recommendationPool =
          matchingCandidates.slice(0, 100);
      }

      const recommendations = shuffle(
        recommendationPool
      ).slice(0, 12);

      return res.json({
        status: "Success",
        totalLikedItems: likedItems.length,
        totalItems: recommendations.length,

        tasteProfile: {
          articleTypes: favouriteArticleTypes,
          categories: favouriteSubCategories,
          colours: favouriteColours,
          usages: favouriteUsages,
          seasons: favouriteSeasons,
          genders: favouriteGenders,
        },

        items: recommendations,
      });
    } catch (error) {
      console.error(
        "Taste recommendation error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Unable to create recommendations from liked items.",
      });
    }
  }
);

// -------------------- REGISTER --------------------

app.post(
  "/api/auth/register",
  async (req, res) => {
    try {
      const {
        username,
        email,
        password,
      } = req.body;

      if (
        !username ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Username, email and password are required.",
        });
      }

      const normalizedUsername =
        username.trim();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const existingUser =
        await User.findOne({
          $or: [
            {
              username:
                normalizedUsername,
            },
            {
              email:
                normalizedEmail,
            },
          ],
        });

      if (existingUser) {
        return res.status(400).json({
          error:
            "Username or email already exists.",
        });
      }

      const user = new User({
        username:
          normalizedUsername,
        email: normalizedEmail,
        password,
        likedItems: [],
      });

      await user.save();

      return res
        .status(201)
        .json({
          status: "Success",
          message:
            "User registered successfully.",
          userId: user._id,
          username:
            user.username,
          email: user.email,
          likedItems:
            user.likedItems,
        });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error.message ||
            "Unable to register user.",
        });
    }
  }
);

// -------------------- LOGIN --------------------

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        usernameOrEmail,
        password,
      } = req.body;

      if (
        !usernameOrEmail ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Username or email and password are required.",
        });
      }

      const loginValue =
        usernameOrEmail.trim();

      const user =
        await User.findOne({
          $or: [
            {
              username:
                loginValue,
            },
            {
              email:
                loginValue.toLowerCase(),
            },
          ],
          password,
        });

      if (!user) {
        return res.status(401).json({
          error:
            "Invalid login details.",
        });
      }

      return res.json({
        status: "Success",
        userId: user._id,
        username: user.username,
        email: user.email,
        likedItems:
          user.likedItems || [],
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error.message ||
            "Unable to log in.",
        });
    }
  }
);

// -------------------- LIKE OR UNLIKE ITEM --------------------

app.post(
  "/api/users/:userId/likes/:itemId",
  async (req, res) => {
    try {
      const { userId } =
        req.params;

      const itemId =
        Number.parseInt(
          req.params.itemId,
          10
        );

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid user ID.",
        });
      }

      if (
        Number.isNaN(itemId)
      ) {
        return res.status(400).json({
          error:
            "Invalid item ID.",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          error:
            "User not found. Please log in again.",
        });
      }

      if (
        !Array.isArray(
          user.likedItems
        )
      ) {
        user.likedItems = [];
      }

      const alreadyLiked =
        user.likedItems.some(
          (likedItemId) =>
            Number(likedItemId) ===
            itemId
        );

      if (alreadyLiked) {
        user.likedItems =
          user.likedItems.filter(
            (likedItemId) =>
              Number(
                likedItemId
              ) !== itemId
          );
      } else {
        user.likedItems.push(
          itemId
        );
      }

      await user.save();

      return res.json({
        status: "Success",
        liked:
          !alreadyLiked,
        likedItems:
          user.likedItems,
      });
    } catch (error) {
      console.error(
        "Like error:",
        error
      );

      return res
        .status(500)
        .json({
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
      const { userId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid user ID.",
        });
      }

      const user =
        await User.findById(
          userId
        ).lean();

      if (!user) {
        return res.status(404).json({
          error:
            "User not found.",
        });
      }

      const likedItemIds =
        Array.isArray(
          user.likedItems
        )
          ? user.likedItems
          : [];

      const items =
        await ClothingItem.find({
          id: {
            $in: likedItemIds,
          },
        }).lean();

      const itemMap =
        new Map(
          items.map((item) => [
            item.id,
            item,
          ])
        );

      const orderedItems =
        likedItemIds
          .map((itemId) =>
            itemMap.get(
              Number(itemId)
            )
          )
          .filter(Boolean);

      return res.json({
        status: "Success",
        totalItems:
          orderedItems.length,
        items: orderedItems,
      });
    } catch (error) {
      console.error(
        "Wishlist error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error.message ||
            "Unable to load wishlist.",
        });
    }
  }
);
// -------------------- UPLOAD CLOTHING ITEM --------------------

app.post(
  "/api/uploads",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Please choose an image to upload.",
        });
      }

      const {
        productDisplayName,
        gender,
        masterCategory,
        subCategory,
        articleType,
        baseColour,
        season,
        usage,
        uploadedBy,
      } = req.body;

      if (!productDisplayName || !articleType) {
        return res.status(400).json({
          error: "Product name and article type are required.",
        });
      }

      const latestItem = await ClothingItem.findOne()
        .sort({ id: -1 })
        .select("id")
        .lean();

      const newItemId =
        typeof latestItem?.id === "number"
          ? latestItem.id + 1
          : Date.now();

      const imageUrl = `/uploads/${req.file.filename}`;

      const newItem = new ClothingItem({
        id: newItemId,
        productDisplayName: productDisplayName.trim(),
        gender: gender?.trim() || "Unisex",
        masterCategory: masterCategory?.trim() || "Apparel",
        subCategory: subCategory?.trim() || "Other",
        articleType: articleType.trim(),
        baseColour: baseColour?.trim() || "Not specified",
        season: season?.trim() || "All Seasons",
        usage: usage?.trim() || "Casual",
        imageUrl,
        uploadedBy: uploadedBy?.trim() || "",
        isUserUpload: true,
      });

      await newItem.save();

      return res.status(201).json({
        status: "Success",
        message: "Clothing item uploaded successfully.",
        item: newItem,
      });
    } catch (error) {
      console.error("Upload error:", error);

      return res.status(500).json({
        error:
          error.message ||
          "Unable to upload clothing item.",
      });
    }
  }
);
// -------------------- UPLOAD CLOTHING ITEM --------------------

app.post(
  "/api/uploads",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Please choose an image to upload.",
        });
      }

      const {
        productDisplayName,
        gender,
        masterCategory,
        subCategory,
        articleType,
        baseColour,
        season,
        usage,
        uploadedBy,
      } = req.body;

      if (!productDisplayName || !articleType) {
        return res.status(400).json({
          error: "Product name and article type are required.",
        });
      }

      const latestItem = await ClothingItem.findOne()
        .sort({ id: -1 })
        .select("id")
        .lean();

      const newItemId =
        typeof latestItem?.id === "number"
          ? latestItem.id + 1
          : Date.now();

      const imageUrl = `/uploads/${req.file.filename}`;

      const newItem = new ClothingItem({
        id: newItemId,
        productDisplayName: productDisplayName.trim(),
        gender: gender?.trim() || "Unisex",
        masterCategory: masterCategory?.trim() || "Apparel",
        subCategory: subCategory?.trim() || "Other",
        articleType: articleType.trim(),
        baseColour: baseColour?.trim() || "Not specified",
        season: season?.trim() || "All Seasons",
        usage: usage?.trim() || "Casual",
        imageUrl,
        uploadedBy: uploadedBy?.trim() || "",
        isUserUpload: true,
      });

      await newItem.save();

      return res.status(201).json({
        status: "Success",
        message: "Clothing item uploaded successfully.",
        item: newItem,
      });
    } catch (error) {
      console.error("Upload error:", error);

      return res.status(500).json({
        error:
          error.message ||
          "Unable to upload clothing item.",
      });
    }
  }
);

// -------------------- 404 JSON RESPONSE --------------------

app.use((req, res) => {
  return res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// -------------------- START SERVER --------------------

const PORT =
  Number(process.env.PORT) ||
  5000;

console.log(
  "SERVER FILE:",
  __filename
);

app.listen(PORT, () => {
  console.log(
    `Matches server running on port ${PORT}`
  );
});