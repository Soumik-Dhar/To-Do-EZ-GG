const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

const PORT = (process.env.PORT || 3000);

let tasks = ["Task 1", "Task 2"];

app.get("/", function(req, res) {
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric"
  }
  let day = new Date().toLocaleDateString("en-US", options);

  res.render("todo", {
    dayOfTheWeek: day,
    newTasks: tasks
  });
});

app.post("/", function(req, res) {
  let task = req.body.item;
  if(req.body.del) {
    if(tasks.length>0)
      tasks.pop();
  }
  else {
    if(!task)
      return;
    tasks.push(task);
  }
  res.redirect("/");
});

app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
