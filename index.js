const express = require('express')
const app = express()
require('dotenv').config()
const port = 3000



const { MongoClient, ServerApiVersion } = require('mongodb');
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



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
