// SETUP
const express = require("express");
const stytch = require("stytch");
const app = express();
require("dotenv").config();

// stytch setup
const client = new stytch.Client({
  project_id: process.env.STYTCH_PID,
  secret: process.env.STYTCH_SECRET,
  env: process.env.STYTCH_ENV === "test" ? stytch.envs.test : stytch.envs.live,
});

// END OF SETUP

// MIDDLEWARE
app.use(express.json())
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})
// END OF MIDDLEWARE

// setup routes
app.post("/loginorcreate", async (req, res) => {
	const { email } = req.body

	try {
		const response = await client.magicLinks.email.loginOrCreate({email})

		res.status(201).json({
			success: true,
			message: `${response.user_created ? 'User created. ' : ''}Magic link sent to ${email}`,
		})
	} catch (err) {
		res.status(400).json({
			success: false,
			message: "Error creating user",
			error: err
		})
	}
})

// when logged in to a new session or new user
app.get('/auth', async (req, res) => {
  const { token } = req.query
  
	try {
    const response = await client.magicLinks.authenticate(token, {
      session_duration_minutes: 5
      // session_duration_minutes: 60 * 24 * 10,
		})

		res.redirect(`http://localhost:3000?session_token=${response.session_token}`)
	} catch (err) {
		console.log(err)

		res.status(400).json({
			success: false,
			message: "Error authenticating",
			error: err
		})
	}
	
})

// when we go to new page, verify token is still usable
app.post('/verify', async (req, res) => {
	const { token } = req.body

	try {
		const response = await client.sessions.authenticate({session_token: token})

		res.status(200).json({
			success: true,
			message: "Session Verified"
		})
	} catch(err) {
		console.log(err)
		
		res.status(400).json({
			success: false,
			message: "Error authenticating",
			error: err
		})
	}
})

app.get('/reset/:id', (req, res) => {
	client
		.users
		.delete(req.params.id)
		.then(resp => {
			console.log(resp)
			res.send("User Deleted")
		})
		.catch(err => {
			res.send("An error occured")
			console.log(err)
		});
})

// initialize app
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
