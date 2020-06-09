const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

const PORT = (process.env.PORT || 3000);
const URL = "mongodb://localhost:27017/todoDB";

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const taskSchema = {
  name: String
};
const Task = mongoose.model("Task", taskSchema);

const task = {
  task1: new Task({
    name: "Welcome to your ToDo list!"
  }),
  task2: new Task({
    name: "Press the + button to add a task"
  }),
  task3: new Task({
    name: "Press here --> to delete a task"
  })
};

const defaultTasks = [task.task1, task.task2, task.task3];

app.get("/", function(req, res) {

  Task.find(function(err, tasks) {
    if (err) {
      console.log("Error in finding tasks : " + err);
    } else if (tasks.length === 0) {
      Task.insertMany(defaultTasks, function(err) {
        if (err) {
          console.log("Error in adding tasks : " + err);
        } else {
          console.log("Successfully added default tasks to list");
        }
      });
      res.redirect("/");
    } else {
      res.render("todo", {
        listTitle: "Today's List", //date.getDate(),
        newTasks: tasks,
        list: "daily"
      });
    }
  });
});

app.get("/work", function(req, res) {
  res.render("todo", {
    listTitle: "Work List",
    newTasks: work,
    list: "work"
  });
});

app.post("/", function(req, res) {
  const formData = req.body;
  const item = formData.item;
  // if (formData.add === "work") {
  //   if (!task)
  //     return;
  //   work.push(task);
  //   res.redirect("/work");
  // } else {
  if (!item)
    return;
  const task = new Task({
    name: item
  });
  task.save();
  res.redirect("/");
  // }
});

app.post("/delete", function(req, res) {
  const item = req.body.item;
  Task.findByIdAndDelete(item, function(err) {
    if (err) {
      console.log("Error in deleting tasks : " + err);
    } else {
      console.log("Successfully deleted tasks from the list");
    }
  });
  setTimeout(function() {
    res.redirect("/");
  }, 1000);
});

app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
