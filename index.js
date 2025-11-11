const express = require('express')
const app = express()
require('dotenv').config()
const port = 3000
const cors = require("cors");
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@eco-tracker.03zxqyv.mongodb.net/?appName=Eco-Tracker`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const db = client.db("EcoTrackDB");
const challengesCollection = db.collection("challenges");
const userChallengesCollection = db.collection("userChallenges");
const tipsCollection = db.collection("tips");
const eventsCollection = db.collection("events");

// CHALLENGES API //
// right now it works properly check by insert fake json data on database manually //
// GET all challenges with filtering
app.get("/api/challenges", async (req, res) => {
  try {
    const {
      category,
      status,
      participants_min,
      participants_max,
      search,
      page = 1,
      limit = 10
    } = req.query;
    // filteringg object
    const filter = {};
    // Category - wise - filter
    if (category) {
      filter.category = { $in: category.split(',') };
    }
    // Participants range wise filtering
    if (participants_min || participants_max) {
      filter.participants = {};
      if (participants_min) filter.participants.$gte = parseInt(participants_min);
      if (participants_max) filter.participants.$lte = parseInt(participants_max);
    }

    // filtering bye search value
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { target: { $regex: search, $options: 'i' } }
      ];
    }

    // Status based filter based on dates
    const now = new Date();
    if (status === 'active') {
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    } else if (status === 'upcoming') {
      filter.startDate = { $gt: now };
    } else if (status === 'completed') {
      filter.endDate = { $lt: now };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const challenges = await challengesCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await challengesCollection.countDocuments(filter);

    res.json({
      success: true,
      data: challenges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching challenges"
    });
  }
});
//new api start from here
// GET single challenge by id filtering....
app.get("/api/challenges/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID"
      });
    }
    const challenge = await challengesCollection.findOne({
      _id: new ObjectId(id)
    });
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }
    res.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching challenge"
    });
  }
});

// new api start from here

// tested with postman api working....

// create new challenge api
app.post("/api/challenges", async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      participants: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Basic validation
    if (!challengeData.title || !challengeData.category || !challengeData.description) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and description are required"
      });
    }

    const result = await challengesCollection.insertOne(challengeData);

    res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      data: { ...challengeData, _id: result.insertedId }
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({
      success: false,
      message: "Error creating challenge"
    });
  }
});

//New Api From here.....

// tested with postman and working on postman 

//  update challenge Data
app.put("/api/challenges/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID"
      });
    }

    const filter = { _id: new ObjectId(id) };
    const update = {
      $set: {
        ...data,
        updatedAt: new Date()
      }
    };

    const result = await challengesCollection.updateOne(filter, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    res.json({
      success: true,
      message: "Challenge updated successfully",
      result
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({
      success: false,
      message: "Error updating challenge"
    });
  }
});
// New Api Start from here.....

// Api working tested on postman app

// dlete challenge Data Api
app.delete("/api/challenges/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID"
      });
    }


    const result = await challengesCollection.deleteOne({
      _id: new ObjectId(id)
    });


    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }


    res.json({
      success: true,
      message: "Challenge deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting challenge"
    });
  }
});
//New Api from Here....


//fetch a lot of git problem
// GET all tips Api
app.get("/api/tips", async (req, res) => {
  try {
    const { category, sort = 'newest', page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { upvotes: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tips = await tipsCollection
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await tipsCollection.countDocuments(filter);

    res.json({
      success: true,
      data: tips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching tips:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tips"
    });
  }
});

// new Api start from here.....

// tested and working no error
// GET all events Api
app.get("/api/events", async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type) filter.eventType = type;


    const now = new Date();
    if (status === 'upcoming') {
      filter.date = { $gte: now };
    } else if (status === 'past') {
      filter.date = { $lt: now };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await eventsCollection
      .find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await eventsCollection.countDocuments(filter);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching events"
    });
  }
});
// New Api Start From Here...
// no error showing but can not get data from data base,, need to fix this api later     (reminder for me!!!!!)
//  user's challenges data
app.get("/api/user-challenges/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userChallenges = await userChallengesCollection
      .aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "challenges",
            localField: "challengeId",
            foreignField: "_id",
            as: "challenge"
          }
        },
        { $unwind: "$challenge" },
        { $sort: { lastUpdated: -1 } }
      ])
      .toArray();

    res.json({
      success: true,
      data: userChallenges
    });
  } catch (error) {
    console.error("Error fetching user challenges:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user challenges"
    });
  }
});
// New Api From Here
// not showing error on console, after fix get api then  need manual test after implement on client side  (reminder for me!!!!!!)
// update progress Api
app.patch("/api/user-challenges/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status, impactAchieved } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user challenge ID"
      });
    }

    const updateData = { lastUpdated: new Date() };
    if (progress !== undefined) updateData.progress = progress;
    if (status) updateData.status = status;
    if (impactAchieved !== undefined) updateData.impactAchieved = impactAchieved;

    const result = await userChallengesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User challenge not found"
      });
    }

    res.json({
      success: true,
      message: "Progress updated successfully"
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: "Error updating progress"
    });
  }
});



// i got some error then fix from AI
// this api functionity and reqirements is critical to understand the concept for me,,,,,,
// GET community statistics Data
app.get("/api/statistics", async (req, res) => {
  try {
    const totalChallenges = await challengesCollection.countDocuments();
    const totalTips = await tipsCollection.countDocuments();
    const totalEvents = await eventsCollection.countDocuments();

    const challenges = await challengesCollection.find().toArray();
    const totalParticipants = challenges.reduce((sum, challenge) => sum + challenge.participants, 0);

    const totalCO2Saved = challenges.reduce((sum, challenge) => {
      return sum + (challenge.participants * 10);
    }, 0);

    const totalPlasticReduced = challenges.reduce((sum, challenge) => {
      return sum + (challenge.participants * 5);
    }, 0);

    res.json({
      success: true,
      data: {
        totalChallenges,
        totalParticipants,
        totalTips,
        totalEvents,
        totalCO2Saved,
        totalPlasticReduced
      }
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics"
    });
  }
});



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
