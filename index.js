const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
var cookieParser = require('cookie-parser')



const app = express()
const port = process.env.PORT || 5000



app.use(
    cors({
        origin: ['http://localhost:5173', 'https://assignment-eleven-b0b1b.web.app'],
        credentials: true,
    }),
)
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.csnq8lx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl);
   
    next();
}


const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access no token' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access error ' })
        }
        req.user = decoded;
        next();
    })
}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const blogsCollection = client.db('blogsList').collection('blogs');
        const wishListCollection = client.db('wishList').collection('wishes');
        const commentCollection = client.db('commentList').collection('comments');

        app.post('/api/v1/blogs', async (req, res) => {
            const newBlog = req.body;
            const result = await blogsCollection.insertOne(newBlog);
            res.send(result);
        })

        app.get('/api/v1/blogs', logger, async (req, res) => {
            const result = await blogsCollection.find().toArray();
            res.send(result);
        })

        app.get('/api/v1/blogs/:id', logger, async (req, res) => {
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

        app.get('/api/v1/wishList', logger, verifyToken, async (req, res) => {
            console.log('cook cook', req.cookies);
            console.log('hello', req.user);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }

            const result = await wishListCollection.find(query).toArray();
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

        app.post('/api/v1/auth/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '30d' })
            res.cookie('token', token,
             {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false, 
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({ success: true })

        })

        app.post('/api/v1/logout', async (req, res) => {
            const user = req.body;
            console.log('logout', user);
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production' ? true : false, 
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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