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
                console.log(err, result)
                if (result == null) {
                    res.send("UserID not avilble. Go to Home and genrate new one.")
                } else {
                    console.log("found user")
                    let addExercise = new Exercise({
                        description: inputDescription,
                        duration: inputDuration,
                        date: inputDate
                    })

                    console.log("Adding data:", addExercise)
                    User.findByIdAndUpdate(
                        inputUserId, { $push: { log: addExercise } }, { new: true },
                        (error, updatedUser) => {
                            if (!error) {
                                console.log(updatedUser)
                                let responseObject = {}
                                responseObject['userId'] = updatedUser.id;
                                responseObject['description'] = updatedUser.description;
                                responseObject['duration'] = updatedUser.duration;
                                responseObject['date'] = updatedUser.date;
                                console.log(responseObject)
                                res.json(responseObject)
                            }
                        })
                }
            })
    }
)