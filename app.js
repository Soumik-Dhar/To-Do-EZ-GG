const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

const PORT = (process.env.PORT || 3000);

let tasks = ["Task 1", "Task 2", "Task 3"];
let work = [];

app.get("/", function(req, res) {

  res.render("todo", {
    listTitle: date.getDate(),
    newTasks: tasks,
    flag: "daily"
  });
});

app.get("/work", function(req, res) {
  res.render("todo", {
    listTitle: "Work List",
    newTasks: work,
    flag: "work"
  });
});

app.get("/test", function(req, res){
  res.render("try");
});

app.post("/", function(req, res) {
  const formData = req.body;
  const task = formData.item;

  if (formData.add === "work") {
    if (!task)
      return;
    work.push(task);
    res.redirect("/work");
  }
  else if(formData.add === "daily") {
    if (!task)
      return;
    tasks.push(task);
    res.redirect("/");
  }
  else if(formData.del === "work") {
    if(work.length>0)
      work.pop();
    res.redirect("/work");
  }
  else {
    if(tasks.length>0)
      tasks.pop();
    res.redirect("/");
  }
});

app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
