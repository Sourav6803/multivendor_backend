const mongoose = require('mongoose');
const connectDatabase = ()=>{
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then((data)=>{
        console.log(`mongood connected with server : ${data.connection.host}`)
    })
}

module.exports = connectDatabase;

// "mongodb+srv://rick07539:iw5HHRv4JdunwlUR@cluster0.ffmnsa4.mongodb.net/ecom?retryWrites=true&w=majority"