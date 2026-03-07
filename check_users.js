import db from "./server/db.js";

const users = db.prepare("SELECT email FROM users").all();
console.log(users);
