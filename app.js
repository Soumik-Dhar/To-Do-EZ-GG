const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const startCase = require("lodash.startcase");
const date = require(__dirname + "/date.js");
// managing environment variables for production and development cases
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    silent: true
  });
}

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

const PORT = (process.env.PORT || 3000);

const USERNAME = process.env.ATLAS_ADMIN_USERNAME;
const PASSWORD = process.env.ATLAS_ADMIN_PASSWORD;
const URL = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0-2akbx.mongodb.net/todoDB?retryWrites=true&w=majority";

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const taskSchema = {
  name: String
};
const Task = mongoose.model("Task", taskSchema);

const listSchema = {
  name: String,
  tasks: [taskSchema]
};
const List = mongoose.model("List", listSchema);

const task = {
  task1: new Task({
    name: "Welcome to your ToDo list!"
  }),
  task2: new Task({
    name: "Press the + button to add a task"
  }),
  task3: new Task({
    name: "<-- Press here to delete a task"
  })
};

const defaultTasks = [task.task1, task.task2, task.task3];

function reroute(err, docs, route, res) {
  if (!err) {
    if (docs) {
      res.redirect(route);
    }
  }
}

let visited = false;

app.get("/", function(req, res) {

  Task.find(function(err, tasks) {
    if (!err) {
      if (tasks.length === 0 && visited === false) {
        visited = true;
        Task.insertMany(defaultTasks, function(err, docs) {
          const route = "/";
          reroute(err, docs, route, res);
        });
      } else {
        res.render("todo", {
          listTitle: date.getDate(),
          newTasks: tasks
        });
      }
    }
  });
});

app.get("/lists/:listRoute", function(req, res) {
  //
  const listRoute = startCase(req.params.listRoute.toLowerCase());

  List.findOne({
    name: listRoute
  }, function(err, listItem) {
    if (!err) {
      if (!listItem) {
        const list = new List({
          name: listRoute,
          tasks: defaultTasks
        });
        list.save(function(err, docs) {
          const route = "/lists/" + listRoute;
          reroute(err, docs, route, res);
        });
      } else {
        res.render("todo", {
          listTitle: listItem.name,
          newTasks: listItem.tasks
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const formData = req.body;
  const item = formData.addItem;
  const listName = formData.listName;

  let flag = 0;
  // checking if entered task is an empty string
  if (!item)
    flag++;
  // inserting task into database if it is not an empty string
  if (!flag) {
    const task = new Task({
      name: item
    });
    if (listName === date.getDate()) {
      task.save(function(err, docs) {
        const route = "/";
        reroute(err, docs, route, res);
      });
    } else {
      List.findOne({
        name: listName
      }, function(err, listItem) {
        if (!err) {
          listItem.tasks.push(task);
          listItem.save(function(err, docs) {
            const route = "/lists/" + listName;
            reroute(err, docs, route, res);
          });
        }
      });
    }
  }
});

app.post("/delete", function(req, res) {
  const formData = req.body;
  const itemId = formData.deleteItem;
  const listName = formData.listName;

  if (listName === date.getDate()) {
    Task.findByIdAndDelete(itemId, function(err, docs) {
      setTimeout(function() {
        const route = "/";
        reroute(err, docs, route, res);
      }, 500);
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        tasks: {
          _id: itemId
        }
      }
    }, {
      useFindAndModify: false
    }, function(err, docs) {
      setTimeout(function() {
        const route = "/lists/" + listName;
        reroute(err, docs, route, res);
      }, 500);
    });
  }
});

app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
