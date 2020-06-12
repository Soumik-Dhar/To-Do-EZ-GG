// importing modules
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

// creating an express app
const app = express();

// using static files and body-parser
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

// setting ejs as view engine
app.set("view engine", "ejs");

// storing ports for production and development
const PORT = (process.env.PORT || 3000);
// getting mongodb atlas database admin credentials
const USERNAME = process.env.ATLAS_ADMIN_USERNAME;
const PASSWORD = process.env.ATLAS_ADMIN_PASSWORD;
// setting url for mongodb server
const URL = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@cluster0-2akbx.mongodb.net/todoDB?retryWrites=true&w=majority";
// connecting to the database
mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// creating schema and model for daily to-do list
const taskSchema = {
  name: String
};
const Task = mongoose.model("Task", taskSchema);
// creating schema and model for custom to-do list
const listSchema = {
  name: String,
  tasks: [taskSchema]
};
const List = mongoose.model("List", listSchema);
// creating default task objects
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
// storing default task objects in an array
const defaultTasks = [task.task1, task.task2, task.task3];
// handling callbacks from mongoose methods and redirecting to required routes
function reroute(err, docs, route, res) {
  if (!err) {
    if (docs) {
      res.redirect(route);
    }
  }
}

// handling GET request to home route
app.get("/", function(req, res) {
  // finding all documents in tasks collection
  Task.find(function(err, tasks) {
    if (!err) {
      // inserting defaultTasks if tasks collection is empty
      if (tasks.length === 0) {
        Task.insertMany(defaultTasks, function(err, docs) {
          const route = "/";
          reroute(err, docs, route, res);
        });
        // rendering defaultTasks with current date as list name
      } else {
        res.render("todo", {
          listTitle: date.getDate(),
          newTasks: tasks
        });
      }
    }
  });
});

// handling GET requests to custom routes
app.get("/lists/:listRoute", function(req, res) {
  // converting listRoute in route parameter to start case minus special characters
  const listRoute = startCase(req.params.listRoute.toLowerCase());
  // finding document whose name field matches listRoute
  List.findOne({
    name: listRoute
  }, function(err, listItem) {
    if (!err) {
      // inserting default tasks to a new list collection if no documents match
      if (!listItem) {
        const list = new List({
          name: listRoute,
          tasks: defaultTasks
        });
        list.save(function(err, docs) {
          const route = "/lists/" + listRoute;
          reroute(err, docs, route, res);
        });
        // rendering default tasks
      } else {
        res.render("todo", {
          listTitle: listItem.name,
          newTasks: listItem.tasks
        });
      }
    }
  });
});

// handling POST request from home route
app.post("/", function(req, res) {
  // getting list name and list item from submitted form
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
    // inserting task for daily to-do list
    if (listName === date.getDate()) {
      task.save(function(err, docs) {
        const route = "/";
        reroute(err, docs, route, res);
      });
      // finding matching document for custom to-do list
    } else {
      // finding document whose name field matches listName
      List.findOne({
        name: listName
      }, function(err, listItem) {
        if (!err) {
          // pusing new task to tasks field of 'listName' document
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

// handling POST request from delete route
app.post("/delete", function(req, res) {
  // getting list name and list item ID from submitted form
  const formData = req.body;
  const itemId = formData.deleteItem;
  const listName = formData.listName;

  // deleting task for daily to-do list
  if (listName === date.getDate()) {
    Task.findByIdAndDelete(itemId, function(err, docs) {
      setTimeout(function() {
        const route = "/";
        reroute(err, docs, route, res);
      }, 250);
    });
    // finding matching document for custom to-do list
  } else {
    // finding document whose name field matches listName
    List.findOneAndUpdate({
      name: listName
    }, {
      // deleting object from tasks array whose _id matches itemId
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
      }, 250);
    });
  }
});

// starting server on PORT
app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
