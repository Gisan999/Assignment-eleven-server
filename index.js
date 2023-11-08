const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
let jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


console.log();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.csnq8lx.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        const blogsCollection = client.db('blogsList').collection('blogs');
        const wishListCollection = client.db('wishList').collection('wishes');
        const commentCollection = client.db('commentList').collection('comments');

        const gateman = (req, res, next) => {
            const { token } = req.cookies

            if (!token) {
                return res.status(401).send({ message: 'you are not authorized' })
            }

            // verify a token symmetric
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ message: 'you are not authorized' })
                }
                console.log(decoded) // bar
                req.user = decoded
                next();
            });

        }





        app.post('/api/v1/blogs', async (req, res) => {
            const newBlog = req.body;
            const result = await blogsCollection.insertOne(newBlog);
            res.send(result);
        })

        app.get('/api/v1/blogs', async (req, res) => {
            const result = await blogsCollection.find().toArray();
            res.send(result);
        })

        app.get('/api/v1/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })

        app.put('/api/v1/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateBlog = req.body;
            const blog = {
                $set: {
                    title: updateBlog.title,
                    img: updateBlog.img,
                    category: updateBlog.category,
                    shortDescription: updateBlog.shortDescription,
                    longDescription: updateBlog.longDescription
                }
            };
            const result = await blogsCollection.updateOne(filter, blog, options);
            res.send(result);
        })

        app.post('/api/v1/wishList', async (req, res) => {
            const add = req.body;
            const result = await wishListCollection.insertOne(add);
            res.send(result);
        })

        app.get('/api/v1/wishList', async (req, res) => {
            const result = await wishListCollection.find().toArray();
            res.send(result)
        })

        app.delete('/api/v1/wishList/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.deleteOne(query);
            res.send(result);
        })


        app.post('/api/v1/comment', async (req, res) => {
            const add = req.body;
            const result = await commentCollection.insertOne(add);
            res.send(result);
        })


        app.get('/api/v1/comment', async (req, res) => {
            const result = await commentCollection.find().toArray();
            res.send(result)
        })

        app.get('/api/v1/feature', async (req, res) => {
            const result = await blogsCollection.find({
                "longDescription": { $exists: true },
                $expr: { $gt: [{ $strLenCP: "$longDescription" }, 10] }
            }).sort({ length: -1 }).limit(-10).toArray()
            res.send(result)
        })

        // app.get('/api/v1/feature', async (req, res) => {
        //   const result = await blogsCollection.aggregate([
        //     {
        //         $project: {
        //             "longDescription": 1,
        //             "field_length": {
        //                 $strLenCP : "$longDescription"
        //             }
        //         }
        //     },
        //     {
        //         "$sort": {
        //             "field_length": -1
        //         }
        //     }
        //   ]);
        //   res.send(result)
        // })
        // app.get('/api/v1/wishList/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await wishListCollection.findOne(query);
        //     res.send(result);
        // })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('server is running')
})
app.listen(port, () => {
    console.log(`blog website server is running on port ${port} `);
})