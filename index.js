import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session  from "express-session";
import passport from "passport"



const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "NEWBOOKS",
    password: "RoomaN18",
    port: 5432
});
db.connect();

const app = express();
const port = 3000;
const saltRounds=6;


// Middleware
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret:"TopSecretWord",
    resave:false,
    saveUninitialized:true,
  }))
  app.use(passport.initialize())
  app.use(passport.session())



// Set the views directory and view engine
app.set('view engine', 'ejs');

// Routes
app.get("/", async (req, res) => {

    res.render("home.ejs")



});


app.get("/register",(req,res)=>{
    res.render("register.ejs")
})

app.get("/login",(rrq,res)=>{
    res.render("login.ejs")
})

app.post("/register",async (req,res)=>{
    let name=req.body.firstname
    let email=req.body.email
    let password=req.body.password

    try {
        const check=await db.query('select * from  users where email=$1',[email])
        if (check.rows.length > 0) {
            res.send("Email already exists. Try logging in.");
          } 

          else{

            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                  console.error("Error hashing password:", err);
                } else {
                  console.log("Hashed Password:", hash);
                  await db.query(
                    "INSERT INTO users (email, password,firstname) VALUES ($1, $2, $3)",
                    [email, hash,name]
                  );
                  res.render("login.ejs");
                }
              });

          }

    
    
    } catch (error) {
        console.log(error)
    }
})


app.post("/login", async (req, res) => {
  const email = req.body.email;
  const loginPassword = req.body.password;

  try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(loginPassword, storedHashedPassword, async (err, result) => {
              if (err) {
                  console.error("Error comparing passwords:", err);
              } else {
                  if (result) {
                      // Store user information in the session
                      req.session.user = {
                          id: user.id,
                          email: user.email,
                          firstname: user.firstname
                      };

                      try {
                          const data = await db.query('SELECT * FROM list_books');
                          const books = data.rows;
                          res.render("index.ejs", { books: books });
                      } catch (error) {
                          console.log("Cannot fetch data", error);
                          res.status(500).send("Internal Server Error");
                      }
                  } else {
                      res.send("Incorrect Password");
                  }
              }
          });
      } else {
          res.send("User not found");
      }
  } catch (err) {
      console.log(err);
  }
});




app.get("/addnewbook",(req,res)=>{
    res.render("add.ejs")
})

app.post("/add-book", async (req, res) => {
  const title = req.body.title;
  const rating = req.body.rating;
  const experience = req.body.experience;
  const feedback = req.body.feedback;
  const url = req.body.image;
  const userId = req.session.user.id; // Get the user ID from the session

  try {
      await db.query(
          "INSERT INTO list_books (title, rating, experience, feedback, img_urls, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
          [title, rating, experience, feedback, url, userId]
      );
      const data = await db.query('SELECT * FROM list_books');
      const books = data.rows;
      res.render("index.ejs", { books: books });
  } catch (error) {
      console.log("Error inserting the data", error);
      res.status(500).send("Internal Server Error");
  }
});




app.get("/mybooks", async (req, res) => {
  const userId = req.session.user.id; // Get the user ID from the session

  try {
      const data = await db.query('SELECT * FROM list_books WHERE user_id = $1', [userId]);
      const books = data.rows;
      res.render("mybooks.ejs", { books: books });
  } catch (error) {
      console.log("Cannot fetch data", error);
      res.status(500).send("Internal Server Error");
  }
});



app.get("/home",async (req,res)=>{
  try {
    const data = await db.query('SELECT * FROM list_books');
    const books = data.rows;
    console.log(books);
    res.render("index.ejs", { books: books });
} catch (error) {
    console.log("Cannot fetch data", error);
    res.status(500).send("Internal Server Error");
}

})


app.post("/deletebook",async (req,res)=>{

  const bookid=req.body.deletebookId;
  console.log(bookid)


    try {
     
      await db.query ('delete from list_books where id=$1',[bookid])
      const data = await db.query('SELECT * FROM list_books');
      const books = data.rows;
      console.log(books);
      res.render("index.ejs", { books: books });
      
    } catch (error) {
      console.log("Error deleting the book",error)
      res.status(500).send("Error deleting book. Please try again later."); // Handle errors

    }
})


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




