const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var mongo = require('mongodb');
var mongoose = require('mongoose');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log(`connection to database established`)
}).catch(err => {
    console.log(`db error ${err.message}`);
    process.exit(-1)
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})

let newExercise = new mongoose.Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: String
})



let newUserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    log: [newExercise]
})
let User = mongoose.model('User', newUserSchema)
let Exercise = mongoose.model('Exercise', newExercise)

let bodyParser = require('body-parser');


app.post('/api/exercise/new-user',
    bodyParser.urlencoded({ extended: false }),
    (req, res) => {
        //getting input username
        let inputUser = req.body.username
            //searching for username in db
        User.findOne({ username: inputUser })
            .exec((err, result) => {
                console.log(err, result)
                if (result == null) {
                    console.log("Username not found. Adding one.....")
                    let newUser = new User({ username: inputUser })
                    newUser.save((err, savedUser) => {
                        if (err) {
                            // if we get error while adding log it.
                            console.log(err)
                        } else {
                            // no error
                            console.log("no error. Sending response...")
                            let responseObject = {}
                            responseObject['username'] = savedUser.username;
                            responseObject['_id'] = savedUser.id;
                            console.log(responseObject)
                            res.json(responseObject)
                        }
                    })
                } else {
                    console.log("username taken")
                    res.send("Username already taken")

                }
            })
    }
)


app.get('/api/exercise/Users',
    (req, res) => {
        User.find({}, (err, result) => {
            if (!err) {
                //console.log(result)
                res.json(result)
            }
        })
    }
)

app.post('/api/exercise/add',
    bodyParser.urlencoded({ extended: false }),
    (req, res) => {
        //getting input user-id
        let inputUserId = req.body.userId,
            inputDescription = req.body.description,
            inputDuration = parseInt(req.body.duration),
            inputDate = req.body.date;

        if (inputDate === '') {
            inputDate = new Date().toISOString().substring(0, 10)
        }
        //searching for username in db
        User.findOne({ _id: inputUserId })
            .exec((err, result) => {
                //console.log(err, result)
                if (result == null) {
                    res.send("UserID not avilble. Go to Home and genrate new one.")
                } else {
                    console.log("found user")
                    let addExercise = new Exercise({
                        description: inputDescription,
                        duration: inputDuration,
                        date: inputDate
                    })

                    //console.log("Adding data:", addExercise)
                    User.findByIdAndUpdate(
                        inputUserId, { $push: { log: addExercise } }, { new: true },
                        (error, updatedUser) => {
                            if (!error) {
                                console.log("No errors, Data saved.....Getting Json result for added Exercise")
                                    // console.log(updatedUser)
                                let responseObject = {}
                                responseObject['_id'] = inputUserId;
                                responseObject['username'] = updatedUser.username;
                                responseObject['description'] = inputDescription;
                                responseObject['duration'] = inputDuration;
                                responseObject['date'] = new Date(addExercise.date).toDateString();
                                // console.log(responseObject)
                                res.json(responseObject)
                            }
                        })
                }
            })
    }
)

app.get('/api/exercise/log', (req, res) => {
    let inputUserId = req.query.userId;

    User.findOne({ _id: inputUserId }, (err, receivedObject) => {
        if (err) {
            console.log(err)
        } else {
            console.log("no error, got the object")
            if (receivedObject == null) {
                console.log("unfortunatly its empty")
                res.send("UserID not avilble. Go to Home and genrate new one.")
            } else {
                console.log("creating a response object")

                let responseObject = {}
                responseObject = receivedObject

                if (req.query.from || req.query.to) {
                    console.log(req.query.from)
                    console.log(req.query.to)

                    let fromDate = new Date(0)
                    toDate = new Date()

                    console.log(fromDate, toDate)
                    if (req.query.from) {
                        fromDate = new Date(req.query.from)
                    }
                    if (req.query.to) {
                        toDate = new Date(req.query.to)
                    }
                    console.log(fromDate, toDate)
                    responseObject.log = responseObject.log.filter((session) => {
                        let sessionDate = new Date(session.date).getTime()
                        return sessionDate >= fromDate && sessionDate <= toDate

                    })
                    if (req.query.limit) {
                        responseObject.log = responseObject.log.slice(0, req.query.limit)
                    }
                }

                responseObject = responseObject.toJSON()
                console.log("creating count variable for log array")
                responseObject.count = responseObject.log.length
                console.log(responseObject.count)
                console.log("your data is :", responseObject)
                console.log("sending json object in  3....2.....1")
                res.json(responseObject)
            }
        }
    })
})